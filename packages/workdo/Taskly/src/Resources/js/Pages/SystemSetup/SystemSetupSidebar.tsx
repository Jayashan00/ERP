import { useTranslation } from 'react-i18next';
import { Tag, Bug } from "lucide-react";
import { SystemSetupSidebar as BaseSystemSetupSidebar, SystemSetupSidebarItem } from "@/components/ui/system-setup-sidebar";

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();

    const sidebarItems: SystemSetupSidebarItem[] = [
        {
            key: 'task-stages',
            label: t('Task Stage'),
            icon: Tag,
            route: 'project.task-stages.index',
            permission: 'manage-task-stages'
        },
        {
            key: 'bug-stages',
            label: t('Bug Stage'),
            icon: Bug,
            route: 'project.bug-stages.index',
            permission: 'manage-bug-stages'
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
