import { useTranslation } from 'react-i18next';
import { FileText, TrendingUp, TrendingDown } from "lucide-react";
import { SystemSetupSidebar as BaseSystemSetupSidebar, SystemSetupSidebarItem } from "@/components/ui/system-setup-sidebar";

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();

    const sidebarItems: SystemSetupSidebarItem[] = [
        {
            key: 'account-types',
            label: t('Account Types'),
            icon: FileText,
            route: 'account.account-types.index',
            permission: 'manage-account-types'
        },
        {
            key: 'revenue-categories',
            label: t('Revenue Categories'),
            icon: TrendingUp,
            route: 'account.revenue-categories.index',
            permission: 'manage-revenue-categories'
        },
        {
            key: 'expense-categories',
            label: t('Expense Categories'),
            icon: TrendingDown,
            route: 'account.expense-categories.index',
            permission: 'manage-expense-categories'
        },
    ];

    return (
        <BaseSystemSetupSidebar
            items={sidebarItems}
            activeItem={activeItem}
            onSectionChange={onSectionChange}
        />
    );
}
