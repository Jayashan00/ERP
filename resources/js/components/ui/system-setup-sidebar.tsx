import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export interface SystemSetupSidebarItem {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    route: string;
    permission?: string;
}

export interface SystemSetupSidebarProps {
    items: SystemSetupSidebarItem[];
    activeItem?: string;
    onSectionChange?: (section: string) => void;
    className?: string;
}

export function SystemSetupSidebar({
    items,
    activeItem,
    onSectionChange,
    className
}: SystemSetupSidebarProps) {
    const { auth } = usePage().props as any;
    const currentRoute = route().current();
    const activeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeItem, currentRoute]);

    const filteredItems = items.filter(item =>
        !item.permission || auth.user?.permissions?.includes(item.permission)
    );

    return (
        <div className={cn("w-full", className)}>
            {/* Mobile Horizontal Tabs */}
            <div className="lg:hidden bg-card border border-border/80 shadow-sm rounded-xl p-1.5 z-20 mb-4">
                <div className="flex flex-row gap-1.5 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.key || currentRoute === item.route;

                        return (
                            <button
                                key={item.key}
                                ref={isActive ? activeRef : null}
                                onClick={() => {
                                    router.get(route(item.route));
                                    onSectionChange?.(item.key);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 outline-none whitespace-nowrap shrink-0 rounded-lg border-b-[3px]",
                                    isActive
                                        ? "bg-primary/10 text-primary border-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200", {
                                    "scale-110": isActive
                                })} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop Vertical Sidebar */}
            <div className="hidden lg:block sticky top-4 bg-card border border-border/80 shadow-sm rounded-xl p-3 z-20">
                <div className="flex flex-col gap-1.5 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 scrollbar-hover-only">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.key || currentRoute === item.route;

                        return (
                            <button
                                key={item.key}
                                ref={isActive ? activeRef : null}
                                onClick={() => {
                                    router.get(route(item.route));
                                    onSectionChange?.(item.key);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 outline-none whitespace-nowrap ltr:text-left rtl:text-right ltr:border-l-[3px] rtl:border-r-[3px] ltr:border-r-0 rtl:border-l-0",
                                    isActive
                                        ? "bg-primary/10 text-primary border-primary ltr:rounded-r-lg ltr:rounded-l-none rtl:rounded-l-lg rtl:rounded-r-none"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent rounded-lg"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200", {
                                    "scale-110": isActive
                                })} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default SystemSetupSidebar;
