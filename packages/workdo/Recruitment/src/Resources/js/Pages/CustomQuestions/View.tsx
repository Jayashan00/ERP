import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BadgeUI from "@/components/badge-ui";
import { useTranslation } from 'react-i18next';
import { HelpCircle, Text, AlignLeft, List, CircleDot, CheckSquare, FileText, Calendar, Tag } from "lucide-react";
import { CustomQuestion } from './types';

interface ViewProps {
    customquestion: CustomQuestion;
}

export default function View({ customquestion }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold">{t('Custom Question Details')}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{customquestion.name}</p>
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Question')}</label>
                        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{customquestion.question || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Type')}</label>
                        <div className="mt-1">
                            {(() => {
                                const typeConfig: any = {
                                    text: { label: t("Text"), icon: Text, color: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/20" },
                                    textarea: { label: t("Textarea"), icon: AlignLeft, color: "bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-950/30 dark:text-indigo-400 dark:ring-indigo-800/20" },
                                    select: { label: t("Select"), icon: List, color: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/20" },
                                    radio: { label: t("Radio"), icon: CircleDot, color: "bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-800/20" },
                                    checkbox: { label: t("Checkbox"), icon: CheckSquare, color: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20" },
                                    number: { label: t("Number"), icon: FileText, color: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20" },
                                    date: { label: t("Date"), icon: Calendar, color: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20" },
                                };
                                const config = typeConfig[customquestion?.type] || { label: customquestion?.type || '-', icon: Tag, color: "bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-800/20" };
                                const IconComponent = config.icon;
                                return <BadgeUI className={`capitalize ${config.color}`} icon={IconComponent}>
                                    {config.label}
                                </BadgeUI>;
                            })()}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Sort Order')}</label>
                        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{customquestion.sort_order || '0'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Required')}</label>
                        <div className="mt-1">
                            <BadgeUI
                                className={customquestion.is_required ? 'bg-red-100 text-red-800 ring-red-600/10 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800/20' : 'bg-yellow-100 text-yellow-800 ring-yellow-600/10 dark:bg-yellow-950/30 dark:text-yellow-400 dark:ring-yellow-800/20'}
                            >
                                {customquestion.is_required ? t('Required') : t('Optional')}
                            </BadgeUI>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Status')}</label>
                        <div className="mt-1">
                            <BadgeUI
                                className={customquestion.is_active ? 'bg-green-100 text-green-800 ring-green-600/10 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-800/20' : 'bg-red-100 text-red-800 ring-red-600/10 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800/20'}
                            >
                                {customquestion.is_active ? t('Active') : t('Inactive')}
                            </BadgeUI>
                        </div>
                    </div>


                </div>

                {(() => {
                    let options: string[] = [];
                    if (customquestion.options) {
                        try {
                            options = typeof customquestion.options === 'string'
                                ? JSON.parse(customquestion.options)
                                : customquestion.options;
                        } catch (e) {
                            options = [];
                        }
                    }
                    return options.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Options')}</label>
                            <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800/80 rounded-xl p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {options.map((option: string, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {customquestion.type === 'radio' && (
                                                    <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-800">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-500" />
                                                    </div>
                                                )}
                                                {customquestion.type === 'checkbox' && (
                                                    <div className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700 flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-800" />
                                                )}
                                                {customquestion.type === 'select' && (
                                                    <List className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                                                )}
                                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                                    {option}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0">
                                                #{index + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })()}

            </div>
        </DialogContent>
    );
}