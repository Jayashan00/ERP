import { useTranslation } from 'react-i18next';
import { Briefcase, Users, MessageSquare, Settings, Building, Lightbulb, ArrowRight, HelpCircle, FileQuestion, FileText, CheckSquare } from "lucide-react";
import { SystemSetupSidebar as BaseSystemSetupSidebar, SystemSetupSidebarItem } from "@/components/ui/system-setup-sidebar";

interface SystemSetupSidebarProps {
    activeItem?: string;
    onSectionChange?: (section: string) => void;
}

export default function SystemSetupSidebar({ activeItem, onSectionChange }: SystemSetupSidebarProps) {
    const { t } = useTranslation();

    const sidebarItems: SystemSetupSidebarItem[] = [
        {
            key: 'job-types',
            label: t('Job Types'),
            icon: Briefcase,
            route: 'recruitment.job-types.index',
            permission: 'manage-job-types'
        },
        {
            key: 'candidate-sources',
            label: t('Candidate Sources'),
            icon: Users,
            route: 'recruitment.candidate-sources.index',
            permission: 'manage-candidate-sources'
        },
        {
            key: 'interview-types',
            label: t('Interview Types'),
            icon: MessageSquare,
            route: 'recruitment.interview-types.index',
            permission: 'manage-interview-types'
        },
        {
            key: 'onboarding-checklists',
            label: t('Onboarding Checklists'),
            icon: CheckSquare,
            route: 'recruitment.onboarding-checklists.index',
            permission: 'manage-onboarding-checklists'
        },
        {
            key: 'brand-settings',
            label: t('Brand Settings'),
            icon: Settings,
            route: 'recruitment.settings.index',
            permission: 'manage-recruitment-brand-settings'
        },
        {
            key: 'about-company',
            label: t('About Company Section'),
            icon: Building,
            route: 'recruitment.about-company.index',
            permission: 'manage-about-company'
        },
        {
            key: 'application-tips',
            label: t('Application Tips Section'),
            icon: Lightbulb,
            route: 'recruitment.application-tips.index',
            permission: 'manage-application-tips'
        },
        {
            key: 'what-happens-next',
            label: t('What Happens Next Section'),
            icon: ArrowRight,
            route: 'recruitment.what-happens-next.index',
            permission: 'manage-what-happens-next'
        },
        {
            key: 'need-help',
            label: t('Need Help Section'),
            icon: HelpCircle,
            route: 'recruitment.need-help.index',
            permission: 'manage-need-help'
        },
        {
            key: 'tracking-faq',
            label: t('Tracking FAQ'),
            icon: FileQuestion,
            route: 'recruitment.tracking-faq.index',
            permission: 'manage-tracking-faq'
        },
        {
            key: 'offer-letter-template',
            label: t('Offer Letter Template'),
            icon: FileText,
            route: 'recruitment.offer-letter-template.index',
            permission: 'manage-offer-letter-template'
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