import React from 'react';
import GenerateAvatar from '@/components/generate-avatar';
import { getImagePath } from '@/utils/helpers';

interface UserColumnProps {
    user?: {
        name?: string | undefined;
        email?: string | undefined;
        avatar?: string | null | undefined;
    } | null;
    name?: string | undefined;
    email?: string | undefined;
    avatar?: string | null | undefined;
    className?: string;
}

export default function UserColumn({ user, name, email, avatar, className }: UserColumnProps) {
    const userName = name || user?.name || '-';
    const userEmail = email ?? user?.email;
    const userAvatar = avatar ?? user?.avatar;

    if (!user && !name && !email) {
        return <span>-</span>;
    }

    return (
        <div className={`flex items-center gap-3 ${className || ''}`}>
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
                {userAvatar ? (
                    <img
                        src={getImagePath(userAvatar)}
                        alt={userName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <GenerateAvatar name={userName} />
                )}
            </div>
            <div className="flex flex-col text-start min-w-0">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                    {userName}
                </span>
                {userEmail && (
                    <span className="text-xs text-muted-foreground truncate">
                        {userEmail}
                    </span>
                )}
            </div>
        </div>
    );
}
