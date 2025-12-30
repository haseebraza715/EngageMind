import React from 'react';
import { cn } from '../../lib/utils';

const Breadcrumb = ({ items, separator, className = '', ...props }) => {
    const defaultSeparator = (
        <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
    );

    return (
        <nav aria-label="Breadcrumb" className={cn('flex items-center', className)} {...props}>
            <ol className="flex items-center gap-2">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {item.href && !isLast ? (
                                <a
                                    href={item.href}
                                    className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    {item.icon && <span className="mr-1">{item.icon}</span>}
                                    {item.label}
                                </a>
                            ) : (
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        isLast
                                            ? 'text-neutral-900 dark:text-neutral-50'
                                            : 'text-neutral-600 dark:text-neutral-400'
                                    )}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.icon && <span className="mr-1">{item.icon}</span>}
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <span className="flex-shrink-0" aria-hidden="true">
                                    {separator || defaultSeparator}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
