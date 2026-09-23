import { useTranslation } from 'react-i18next';
import { BarChart3, Target } from "lucide-react";
import { SystemSetupSidebar as BaseSystemSetupSidebar, SystemSetupSidebarItem } from "@/components/ui/system-setup-sidebar";

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();

    const sidebarItems: SystemSetupSidebarItem[] = [
        {
            key: 'indicator-categories',
            label: t('Indicator Categories'),
            icon: BarChart3,
            route: 'performance.indicator-categories.index',
            permission: 'manage-performance-indicator-categories'
        },
        {
            key: 'goal-types',
            label: t('Goal Types'),
            icon: Target,
            route: 'performance.goal-types.index',
            permission: 'manage-goal-types'
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