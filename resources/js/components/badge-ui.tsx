import React from 'react';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';

interface BadgeUIProps {
    children: React.ReactNode;
    className?: string;
    icon?: LucideIcon;
    color?: string;
    onClick?: () => void;
}

export default function BadgeUI({
    children,
    className,
    icon: Icon,
    color,
    onClick
}: BadgeUIProps) {
    let customStyle: React.CSSProperties = {};
    if (color) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const fullHex = hex.length === 3
                ? hex.split('').map(c => c + c).join('')
                : hex;
            const r = parseInt(fullHex.substring(0, 2), 16) || 0;
            const g = parseInt(fullHex.substring(2, 4), 16) || 0;
            const b = parseInt(fullHex.substring(4, 6), 16) || 0;
            const ringColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
            customStyle = {
                backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
                color: color,
                borderColor: ringColor,
                boxShadow: `inset 0 0 0 1px ${ringColor}`,
                ['--tw-ring-color' as any]: ringColor,
            };
        } else {
            customStyle = {
                color: color,
                borderColor: color,
                boxShadow: `inset 0 0 0 1px ${color}`,
                ['--tw-ring-color' as any]: color,
            };
        }
    }

    return (
        <span
            onClick={onClick}
            style={customStyle}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize max-w-full ring-1 ring-inset bg-zinc-50 text-zinc-700 ring-zinc-600/20",
                className,
                onClick && "cursor-pointer"
            )}
        >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span className="truncate">{children}</span>
        </span>
    );
}
