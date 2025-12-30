import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Tabs = ({
    tabs,
    defaultTab = 0,
    onChange,
    className = '',
    variant = 'default',
    ...props
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleTabClick = (index) => {
        setActiveTab(index);
        onChange?.(index);
    };

    const variants = {
        default: 'border-b border-neutral-200 dark:border-neutral-700',
        pills: 'bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg',
        underline: '',
    };

    const tabVariants = {
        default: (isActive) => cn(
            'px-4 py-2 font-medium transition-colors relative',
            isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        ),
        pills: (isActive) => cn(
            'px-4 py-2 font-medium rounded-md transition-colors relative',
            isActive
                ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        ),
        underline: (isActive) => cn(
            'px-4 py-2 font-medium transition-colors relative',
            isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        ),
    };

    return (
        <div className={className} {...props}>
            {/* Tab Headers */}
            <div className={cn('flex gap-1', variants[variant])}>
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => handleTabClick(index)}
                        className={tabVariants[variant](activeTab === index)}
                        role="tab"
                        aria-selected={activeTab === index}
                        aria-controls={`tabpanel-${index}`}
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}

                        {/* Active indicator for default and underline variants */}
                        {(variant === 'default' || variant === 'underline') && activeTab === index && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {tabs.map((tab, index) => (
                    <div
                        key={index}
                        id={`tabpanel-${index}`}
                        role="tabpanel"
                        hidden={activeTab !== index}
                        className={activeTab === index ? 'animate-fade-in' : ''}
                    >
                        {activeTab === index && tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tabs;
