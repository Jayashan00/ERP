import { useTranslation } from 'react-i18next';
import { Tag, Percent, Ruler } from "lucide-react";
import { SystemSetupSidebar as BaseSystemSetupSidebar, SystemSetupSidebarItem } from "@/components/ui/system-setup-sidebar";

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();

    const sidebarItems: SystemSetupSidebarItem[] = [
        {
            key: 'item-categories',
            label: t('Category'),
            icon: Tag,
            route: 'product-service.item-categories.index',
            permission: 'manage-product-service-categories'
        },
        {
            key: 'taxes',
            label: t('Taxes'),
            icon: Percent,
            route: 'product-service.taxes.index',
            permission: 'manage-product-service-taxes'
        },
        {
            key: 'units',
            label: t('Units'),
            icon: Ruler,
            route: 'product-service.units.index',
            permission: 'manage-product-service-units'
        }
    ];

    return (
        <BaseSystemSetupSidebar
            items={sidebarItems}
            activeItem={activeItem}
            onSectionChange={onSectionChange}
        />
    );
}
