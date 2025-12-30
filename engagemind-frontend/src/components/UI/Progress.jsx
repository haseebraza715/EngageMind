import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Progress = ({
    value = 0,
    max = 100,
    label,
    showValue = false,
    variant = 'primary',
    size = 'md',
    animated = false,
    className = '',
    ...props
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
        primary: 'bg-primary-600 dark:bg-primary-500',
        secondary: 'bg-secondary-600 dark:bg-secondary-500',
        accent: 'bg-accent-600 dark:bg-accent-500',
        success: 'bg-green-600 dark:bg-green-500',
        warning: 'bg-amber-600 dark:bg-amber-500',
        danger: 'bg-red-600 dark:bg-red-500',
    };

    const sizes = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className={cn('w-full', className)} {...props}>
            {(label || showValue) && (
                <div className="flex items-center justify-between mb-2">
                    {label && (
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {label}
                        </span>
                    )}
                    {showValue && (
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            <div className={cn('w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden', sizes[size])}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', variants[variant], animated && 'animate-progress')}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    );
};

// Circular Progress
export const CircularProgress = ({
    value = 0,
    max = 100,
    size = 120,
    strokeWidth = 8,
    variant = 'primary',
    showValue = true,
    className = '',
    ...props
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const variants = {
        primary: 'stroke-primary-600 dark:stroke-primary-500',
        secondary: 'stroke-secondary-600 dark:stroke-secondary-500',
        accent: 'stroke-accent-600 dark:stroke-accent-500',
        success: 'stroke-green-600 dark:stroke-green-500',
        warning: 'stroke-amber-600 dark:stroke-amber-500',
        danger: 'stroke-red-600 dark:stroke-red-500',
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)} {...props}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className="stroke-neutral-200 dark:stroke-neutral-700"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className={variants[variant]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    strokeLinecap="round"
                />
            </svg>
            {showValue && (
                <span className="absolute text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
};

export default Progress;
