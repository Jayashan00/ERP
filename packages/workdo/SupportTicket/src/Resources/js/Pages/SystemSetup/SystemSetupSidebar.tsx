import { useTranslation } from 'react-i18next';
import { Folder, HelpCircle, Library, Palette, FileEdit, Type, MousePointer, Link, Info, MapPin } from "lucide-react";
import { SystemSetupSidebar as BaseSystemSetupSidebar, SystemSetupSidebarItem } from "@/components/ui/system-setup-sidebar";

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();

    const sidebarItems: SystemSetupSidebarItem[] = [
        {
            key: 'categories',
            label: t('Categories'),
            icon: Folder,
            route: 'ticket-category.index',
            permission: 'manage-ticket-categories'
        },
        {
            key: 'support-categories',
            label: t('Support Category'),
            icon: HelpCircle,
            route: 'support-category.index',
            permission: 'manage-support-categories'
        },
        {
            key: 'knowledge-categories',
            label: t('KnowledgeBase Category'),
            icon: Library,
            route: 'knowledge-category.index',
            permission: 'manage-knowledge-base'
        },
        {
            key: 'brand-settings',
            label: t('Brand Settings'),
            icon: Palette,
            route: 'support-ticket.settings.brand',
            permission: 'manage-support-settings'
        },
        {
            key: 'custom-pages',
            label: t('Custom Pages'),
            icon: FileEdit,
            route: 'support-ticket.custom-pages.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'title-sections',
            label: t('Title Sections'),
            icon: Type,
            route: 'support-ticket.title-sections.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'cta-sections',
            label: t('CTA Sections'),
            icon: MousePointer,
            route: 'support-ticket.cta-sections.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'quick-links',
            label: t('Quick Links'),
            icon: Link,
            route: 'support-ticket.quick-links.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'support-information',
            label: t('Support Information'),
            icon: Info,
            route: 'support-ticket.support-information.index',
            permission: 'manage-support-settings'
        },
        {
            key: 'contact-information',
            label: t('Contact Information'),
            icon: MapPin,
            route: 'support-ticket.contact-information.index',
            permission: 'manage-support-settings'
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