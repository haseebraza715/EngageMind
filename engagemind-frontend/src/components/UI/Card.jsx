import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Card = ({
  children,
  variant = 'default',
  hover = false,
  interactive = false,
  className = '',
  onClick,
  header,
  footer,
  image,
  imageAlt = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-300 relative overflow-hidden';

  const variants = {
    default: 'surface-card p-6',
    elevated: 'surface-elevated p-6',
    glass: 'glass p-6',
    'glass-strong': 'surface-hero p-6',
    'glass-light': 'glass p-6',
    outline: 'bg-transparent border border-neutral-200/70 dark:border-white/10 p-6',
    gradient: 'surface-card p-6',
  };

  const hoverClasses = (hover || interactive)
    ? 'hover:shadow-elevated hover:-translate-y-1 hover:border-primary-300/60 dark:hover:border-primary-700/60'
    : '';

  const interactiveClasses = interactive ? 'cursor-pointer active:scale-[0.98]' : '';

  const CardContent = (
    <>
      {image && (
        <div className="relative w-full h-48 -m-6 mb-4">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {header && (
        <div className="card-header mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
          {header}
        </div>
      )}

      <div className="card-body">
        {children}
      </div>

      {footer && (
        <div className="card-footer mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          {footer}
        </div>
      )}
    </>
  );

  if (interactive || onClick) {
    return (
      <motion.div
        className={cn(baseClasses, variants[variant], hoverClasses, interactiveClasses, className)}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {CardContent}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variants[variant], hoverClasses, className)}
      {...props}
    >
      {CardContent}
    </div>
  );
};

// Card Header component
export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Title component
export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3
      className={cn('text-xl font-semibold text-neutral-900 dark:text-neutral-50', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

// Card Description component
export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p
      className={cn('text-sm text-neutral-600 dark:text-neutral-400', className)}
      {...props}
    >
      {children}
    </p>
  );
};

// Card Footer component
export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
