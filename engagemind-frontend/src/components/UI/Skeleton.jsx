import React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({
    className = '',
    variant = 'default',
    width,
    height,
    circle = false,
    count = 1,
    ...props
}) => {
    const baseClasses = 'skeleton';

    const variants = {
        default: 'h-4',
        text: 'h-4 mb-2',
        title: 'h-8 mb-4',
        avatar: 'h-12 w-12 rounded-full',
        button: 'h-10 w-24 rounded-lg',
        card: 'h-48 rounded-xl',
        image: 'h-64 rounded-lg',
    };

    const skeletonClasses = cn(
        baseClasses,
        !width && !height && variants[variant],
        circle && 'rounded-full',
        className
    );

    const style = {
        ...(width && { width }),
        ...(height && { height }),
    };

    if (count > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className={skeletonClasses}
                        style={style}
                        {...props}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={skeletonClasses}
            style={style}
            {...props}
        />
    );
};

// Skeleton Card
export const SkeletonCard = ({ className = '' }) => {
    return (
        <div className={cn('glass-card', className)}>
            <Skeleton variant="image" className="mb-4" />
            <Skeleton variant="title" />
            <Skeleton count={3} />
            <div className="flex gap-2 mt-4">
                <Skeleton variant="button" />
                <Skeleton variant="button" />
            </div>
        </div>
    );
};

// Skeleton List
export const SkeletonList = ({ count = 5, className = '' }) => {
    return (
        <div className={cn('space-y-4', className)}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                    <Skeleton variant="avatar" />
                    <div className="flex-1">
                        <Skeleton variant="title" width="60%" />
                        <Skeleton width="40%" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
