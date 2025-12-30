import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const Dropdown = ({
    trigger,
    children,
    className = '',
    align = 'left',
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen]);

    const alignments = {
        left: 'left-0',
        right: 'right-0',
        center: 'left-1/2 -translate-x-1/2',
    };

    return (
        <div ref={dropdownRef} className="relative inline-block" {...props}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            'absolute z-50 mt-2 min-w-[200px] glass-strong rounded-xl shadow-xl overflow-hidden',
                            alignments[align],
                            className
                        )}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Dropdown Item
export const DropdownItem = ({
    children,
    onClick,
    icon,
    danger = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const handleClick = () => {
        if (!disabled) {
            onClick?.();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            {...props}
        >
            {icon && <span className="text-lg">{icon}</span>}
            {children}
        </button>
    );
};

// Dropdown Divider
export const DropdownDivider = () => {
    return <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />;
};

// Dropdown Header
export const DropdownHeader = ({ children, className = '' }) => {
    return (
        <div className={cn('px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase', className)}>
            {children}
        </div>
    );
};

export default Dropdown;
