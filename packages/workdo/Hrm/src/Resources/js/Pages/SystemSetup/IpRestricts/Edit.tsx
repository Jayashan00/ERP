import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';

import { EditIpRestrictProps, IpRestrictFormData } from './types';

export default function Edit({ iprestrict, onSuccess }: EditIpRestrictProps) {
    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm<IpRestrictFormData>({
        ip: iprestrict.ip ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('hrm.ip-restricts.update', iprestrict.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Edit Ip Restrict')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="ip">{t('Ip')}</Label>
                    <Input
                        id="ip"
                        type="text"
                        value={data.ip}
                        onChange={(e) => setData('ip', e.target.value)}
                        placeholder={t('Enter Ip')}
                        required
                    />
                    <InputError message={errors.ip} />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onSuccess()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Updating...') : t('Update')}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}