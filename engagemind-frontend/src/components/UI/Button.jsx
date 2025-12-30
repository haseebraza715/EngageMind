import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const [ripples, setRipples] = useState([]);

  // Ripple effect handler
  const handleRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = { x, y, size, id: Date.now() };
    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (e) => {
    if (!disabled && !loading) {
      handleRipple(e);
      onClick?.(e);
    }
  };

  /* New Modern Button Base - relying on index.css .btn class */
  const baseClasses = 'btn relative overflow-hidden';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    glass: 'glass text-primary-600 dark:text-primary-400 hover:bg-white/80 dark:hover:bg-neutral-900/80 hover:shadow-xl focus:ring-primary-500',
  };

  const sizes = {
    sm: icon ? 'p-2' : 'px-4 py-2 text-xs gap-1.5',
    md: icon ? 'p-3' : 'px-6 py-2.5 text-sm gap-2',
    lg: icon ? 'p-4' : 'px-8 py-3 text-base gap-2.5',
  };

  const disabledClasses = (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <motion.button
      type={type}
      className={cn(variants[variant], sizes[size], disabledClasses, className, baseClasses)}
      disabled={disabled || loading}
      onClick={handleClick}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {/* Ripple effect */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {/* Loading spinner */}
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {!icon && <span>Loading...</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

// Button Group component for related actions
export const ButtonGroup = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('inline-flex rounded-xl shadow-sm', className)} role="group" {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;

          // Adjust rounding logic for groups
          const roundingClass = isFirst
            ? 'rounded-r-none'
            : isLast
              ? 'rounded-l-none -ml-px'
              : 'rounded-none -ml-px';

          return React.cloneElement(child, {
            className: cn(
              child.props.className,
              roundingClass
            ),
          });
        }
        return child;
      })}
    </div>
  );
};

export default Button;
