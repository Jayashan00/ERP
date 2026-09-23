import { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { usePage, useForm } from '@inertiajs/react';
import { Tag } from 'lucide-react';
import { Deal } from './types';

interface DealLabelViewProps {
    deal: Deal;
    onSuccess?: () => void;
}

interface Label {
    id: number;
    name: string;
    color: string;
    pipeline_id?: number;
    pipeline?: {
        id: number;
        name: string;
    };
}

export default function DealLabelView({ deal, onSuccess }: DealLabelViewProps) {
    const { t } = useTranslation();
    const { labels } = usePage().props as { labels: Label[] };
    
    // Filter labels for current deal's pipeline only
    const pipelineLabels = labels?.filter(label => label.pipeline_id === deal.pipeline_id) || [];
    const [selectedLabels, setSelectedLabels] = useState<{[key: number]: boolean}>(() => {
        const selected: {[key: number]: boolean} = {};
        if (deal.labels) {
            const labelIds = deal.labels.split(',').map(Number).filter(Boolean);
            labelIds.forEach(id => {
                selected[id] = true;
            });
        }
        return selected;
    });
    
    const { data, setData, patch, processing } = useForm({
        labels: deal.labels || ''
    });

    const handleLabelChange = (labelId: number, checked: boolean) => {
        const newSelected = { ...selectedLabels };
        if (checked) {
            newSelected[labelId] = true;
        } else {
            delete newSelected[labelId];
        }
        setSelectedLabels(newSelected);
        const labelIds = Object.keys(newSelected).filter(key => newSelected[parseInt(key)]);
        
        setData('labels', labelIds.join(','));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('lead.deals.update-labels', deal.id), {
            onSuccess: () => {
                onSuccess?.();
            }
        });
    };

    const selectedCount = Object.keys(selectedLabels).filter(k => selectedLabels[parseInt(k)]).length;

    return (
        <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3 pr-6">
                    <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-lg flex-shrink-0">
                        <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <DialogTitle className="text-base font-semibold whitespace-nowrap">{t('Deal Labels')}</DialogTitle>
                            {selectedCount > 0 && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {selectedCount} {t('selected')}
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{deal.name}</p>
                    </div>
                </div>
            </DialogHeader>

            <div className="max-h-72 overflow-y-auto py-2">
                {pipelineLabels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Tag className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">{t('No labels available for this pipeline')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {pipelineLabels.map((label) => {
                            const color = label.color.startsWith('#') ? label.color : `#${label.color}`;
                            return (
                                <label
                                    key={label.id}
                                    htmlFor={`label-${label.id}`}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/40 ${
                                        selectedLabels[label.id] ? 'bg-muted/20' : ''
                                    }`}
                                >
                                    <Checkbox
                                        id={`label-${label.id}`}
                                        checked={selectedLabels[label.id] || false}
                                        onCheckedChange={(checked) => handleLabelChange(label.id, !!checked)}
                                    />
                                    <span
                                        className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border capitalize"
                                        style={{
                                            backgroundColor: `${color}0d`,
                                            color: color,
                                            borderColor: `${color}30`
                                        }}
                                    >
                                        {label.name}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" size="sm" onClick={onSuccess}>
                    {t('Cancel')}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={processing || pipelineLabels.length === 0}>
                    {processing ? t('Assigning...') : t('Assign')}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}