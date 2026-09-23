import { PropsWithChildren, ReactNode, Fragment, useEffect, useState } from "react";
import {AppSidebar} from "@/components/app-sidebar";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NavUser } from "@/components/nav-user";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { BrandProvider, useBrand } from "@/contexts/brand-context";
import CookieConsent from "@/components/cookie-consent";
import { useFavicon } from "@/hooks/use-favicon";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { UserX, ArrowLeft } from "lucide-react";
import { useFlashMessages } from "@/hooks/useFlashMessages";

function AuthenticatedLayoutContent({
    header,
    children,
    breadcrumbs,
    pageTitle,
    pageDescription,
    pageActions,
    backUrl,
    className,
    ...props
}: PropsWithChildren<{
    header?: ReactNode;
    breadcrumbs?: Array<{label: string, url?: string}>;
    pageTitle?: string;
    pageDescription?: ReactNode;
    pageActions?: ReactNode;
    backUrl?: string;
    className?: string;
}>) {
    const { t } = useTranslation();
    const { auth, companyAllSetting, adminAllSetting } = usePage<PageProps>().props as any;
    const { settings } = useBrand();
    useFavicon();
    useFlashMessages();

    // The fixed-width expanded sidebar (16rem) leaves too little room for
    // desktop-sized content between mobile and ~1280px (tablets, small
    // laptops), so default to the sidebar's built-in icon-only mode there
    // and only expand it automatically at true desktop widths. Users can
    // still toggle it manually at any size via the SidebarTrigger.
    const SIDEBAR_AUTO_EXPAND_BREAKPOINT = 1280;
    const [sidebarOpen, setSidebarOpen] = useState(() =>
        typeof window === "undefined" ? true : window.innerWidth >= SIDEBAR_AUTO_EXPAND_BREAKPOINT
    );
    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${SIDEBAR_AUTO_EXPAND_BREAKPOINT}px)`);
        const onChange = () => setSidebarOpen(mql.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return (
        <>
        <Head>
            {companyAllSetting?.metaKeywords && (
                <meta name="keywords" content={companyAllSetting.metaKeywords} />
            )}
            {companyAllSetting?.metaDescription && (
                <meta name="description" content={companyAllSetting.metaDescription} />
            )}
            {companyAllSetting?.metaImage && (
                <meta property="og:image" content={companyAllSetting.metaImage} />
            )}
        </Head>
        <div
            className={settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr'}
            data-theme={settings.themeMode}
            dir={settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr'}
            style={{ direction: settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr' }}
        >
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <AppSidebar />

            <SidebarInset className="overflow-visible"
                style={{ direction: settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr' }}
                dir={settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr'}
            >
                <header
                    className={`bg-background flex h-auto min-h-12 shrink-0 items-center gap-2 px-3 py-2 border-b mb-2 justify-between sm:h-12 sm:px-6 lg:px-8 xl:px-12 sm:py-1`}
                    >
                    {/* Sidebar + Breadcrumb */}
                    <div className={`flex items-center gap-2 ${ settings.layoutDirection === "rtl" ? "order-2 flex-row-reverse" : "order-1" }`} >
                        {/* SidebarTrigger */}
                        <SidebarTrigger className={`-ml-1 ${ settings.layoutDirection === "rtl" ? "order-3" : "order-1" }`} />

                        {/* Separator */}
                        <Separator orientation="vertical" className="mr-2 h-4 order-2 hidden lg:block" />

                        {/* Breadcrumb */}
                        <Breadcrumb className={`hidden lg:block ${ settings.layoutDirection === "rtl" ? "order-1" : "order-3" }`} >
                            <BreadcrumbList className={`flex ${ settings.layoutDirection === "rtl" ? "justify-end" : "justify-start" }`} >
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={route("dashboard")}>{t('Dashboard')}</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs?.map((crumb, index) => (
                                <Fragment key={index}>
                                <BreadcrumbSeparator className={settings.layoutDirection === 'rtl' ? 'rotate-180' : ''} />
                                <BreadcrumbItem>
                                    {crumb.url ? (
                                    <BreadcrumbLink asChild>
                                        <Link href={crumb.url}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                    ) : (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                    )}
                                </BreadcrumbItem>
                                </Fragment>
                            ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* NavUser */}
                    <div
                        className={`flex items-center gap-2 ${
                        settings.layoutDirection === "rtl" ? "order-1 flex-row-reverse" : "order-2"
                        }`}
                    >
                        {/* Leave Impersonation Button */}
                        {auth.impersonating && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.post(route('users.leave-impersonation'))}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50 px-2 sm:px-3"
                            >
                                <UserX className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">{t('Leave Login As User')}</span>
                            </Button>
                        )}
                        <NavUser user={auth.user} inHeader={true} />
                    </div>
                </header>

                <main className="px-2.5 sm:px-6 lg:px-8 xl:px-12 pt-2 pb-5 h-full">
                    {pageTitle && (
                        <div className="flex flex-wrap items-center justify-between mb-3 gap-x-4 gap-y-2 sm:mb-4 sm:gap-3" dir={settings.layoutDirection}>
                            <div className="min-w-0">
                                <h1 className="text-lg font-semibold text-foreground break-words sm:text-xl">{pageTitle}</h1>
                                {pageDescription && (
                                    <p className="text-sm text-muted-foreground mt-1">{pageDescription}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {backUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2 h-8 px-3"
                                        onClick={() => router.visit(backUrl)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        {t('Back')}
                                    </Button>
                                )}
                                {pageActions}
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
        <CookieConsent settings={adminAllSetting || {}} />
        </div>
        </>
    );
}

export default function AuthenticatedLayout({
    children,
    header,
    breadcrumbs,
    pageTitle,
    pageDescription,
    pageActions,
    backUrl,
    className,
    ...props
}: PropsWithChildren<{
    header?: ReactNode;
    breadcrumbs?: Array<{label: string, url?: string}>;
    pageTitle?: string;
    pageDescription?: ReactNode;
    pageActions?: ReactNode;
    backUrl?: string;
    className?: string;
}>) {
    return (
        <BrandProvider>
            <AuthenticatedLayoutContent
                header={header}
                breadcrumbs={breadcrumbs}
                pageTitle={pageTitle}
                pageDescription={pageDescription}
                pageActions={pageActions}
                backUrl={backUrl}
                className={className}
                {...props}
            >
                {children}
            </AuthenticatedLayoutContent>
        </BrandProvider>
    );
}
