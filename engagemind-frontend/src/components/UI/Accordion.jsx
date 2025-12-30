import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const Accordion = ({
    items,
    allowMultiple = false,
    defaultOpen = [],
    className = '',
    ...props
}) => {
    const [openItems, setOpenItems] = useState(defaultOpen);

    const toggleItem = (index) => {
        if (allowMultiple) {
            setOpenItems((prev) =>
                prev.includes(index)
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
            );
        } else {
            setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
        }
    };

    return (
        <div className={cn('space-y-2', className)} {...props}>
            {items.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    content={item.content}
                    isOpen={openItems.includes(index)}
                    onToggle={() => toggleItem(index)}
                    icon={item.icon}
                />
            ))}
        </div>
    );
};

const AccordionItem = ({ title, content, isOpen, onToggle, icon }) => {
    return (
        <div className="group border border-neutral-200 dark:border-neutral-700/50 rounded-xl overflow-hidden bg-white dark:bg-[#0A0A0A] hover:border-neural-300 dark:hover:border-neutral-600 transition-colors">
            <button
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center justify-between p-5 text-left font-medium transition-all',
                    'text-neutral-900 dark:text-neutral-100',
                    isOpen && 'bg-neutral-50/50 dark:bg-white/5 text-primary-600 dark:text-primary-400'
                )}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-primary-500">{icon}</span>}
                    <span className="text-lg">{title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500",
                        isOpen && "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    )}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-white/[0.02] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Accordion;
