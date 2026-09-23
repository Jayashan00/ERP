import { useTranslation } from 'react-i18next';
import { GitBranch, Layers, Target, Tag, Globe } from "lucide-react";
import { SystemSetupSidebar as BaseSystemSetupSidebar, SystemSetupSidebarItem } from "@/components/ui/system-setup-sidebar";

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();

    const sidebarItems: SystemSetupSidebarItem[] = [
        {
            key: 'pipelines',
            label: t('Pipelines'),
            icon: GitBranch,
            route: 'lead.pipelines.index',
            permission: 'manage-pipelines'
        },
        {
            key: 'lead-stages',
            label: t('Lead Stages'),
            icon: Layers,
            route: 'lead.lead-stages.index',
            permission: 'manage-lead-stages'
        },
        {
            key: 'deal-stages',
            label: t('Deal Stages'),
            icon: Target,
            route: 'lead.deal-stages.index',
            permission: 'manage-deal-stages'
        },
        {
            key: 'labels',
            label: t('Labels'),
            icon: Tag,
            route: 'lead.labels.index',
            permission: 'manage-labels'
        },
        {
            key: 'sources',
            label: t('Sources'),
            icon: Globe,
            route: 'lead.sources.index',
            permission: 'manage-sources'
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