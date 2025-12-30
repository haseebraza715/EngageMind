import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

const Input = ({
  type = 'text',
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  floating = false,
  clearable = false,
  onClear,
  prepend,
  append,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;

  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const handleClear = () => {
    setHasValue(false);
    onClear?.();
  };

  const inputClasses = cn(
    'input-field w-full transition-all duration-200',
    error && 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400',
    leftIcon && 'pl-10',
    (rightIcon || clearable) && 'pr-10',
    floating && 'placeholder-transparent',
    prepend && 'rounded-l-none',
    append && 'rounded-r-none',
    className
  );

  const labelClasses = cn(
    'block text-sm font-medium transition-all duration-200',
    floating
      ? cn(
        'absolute left-4 pointer-events-none',
        (isFocused || hasValue)
          ? '-top-2 text-xs bg-white/90 dark:bg-[#0f172a] px-1 text-primary-600 dark:text-primary-400'
          : 'top-3 text-neutral-500 dark:text-neutral-400'
      )
      : 'text-neutral-700 dark:text-neutral-300 mb-2'
  );

  return (
    <div className={cn('relative', containerClassName)}>
      {/* Label (Non-floating) */}
      {label && !floating && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}

      <div className={cn('flex items-stretch', (prepend || append) && 'flex-row')}>
        {/* Prepend */}
        {prepend && (
          <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-neutral-300/70 dark:border-white/10 bg-white dark:bg-[#0f172a] text-neutral-700 dark:text-neutral-300 text-sm">
            {prepend}
          </span>
        )}

        <div className="relative flex-1">
          {/* Label (Floating) */}
          {label && floating && (
            <label htmlFor={inputId} className={labelClasses}>
              {label}
            </label>
          )}

          {/* Left Icon */}
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 dark:text-neutral-400"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            id={inputId}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          />

          {/* Right Icon or Clear Button */}
          {(rightIcon || (clearable && hasValue)) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {clearable && hasValue ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  aria-label="Clear input"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : rightIcon ? (
                <span className="text-neutral-500 dark:text-neutral-400">{rightIcon}</span>
              ) : null}
            </div>
          )}
        </div>

        {/* Append */}
        {append && (
          <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-neutral-300/70 dark:border-white/10 bg-white dark:bg-[#0f172a] text-neutral-700 dark:text-neutral-300 text-sm">
            {append}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// Textarea with auto-resize
export const Textarea = ({
  label,
  error,
  className = '',
  containerClassName = '',
  autoResize = false,
  ...props
}) => {
  const textareaRef = useRef(null);
  const inputId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value, autoResize]);

  const textareaClasses = cn(
    'input-field w-full resize-none transition-all duration-200',
    error && 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400',
    className
  );

  return (
    <div className={cn('relative', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
        </label>
      )}

      <textarea
        ref={textareaRef}
        id={inputId}
        className={textareaClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        rows={autoResize ? 1 : 4}
        {...props}
      />

      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// Search Input with built-in clear functionality
export const SearchInput = ({ onSearch, ...props }) => {
  const [value, setValue] = useState('');

  const handleChange = (e) => {
    setValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleClear = () => {
    setValue('');
    onSearch?.('');
  };

  return (
    <Input
      type="search"
      value={value}
      onChange={handleChange}
      onClear={handleClear}
      clearable
      leftIcon={
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      {...props}
    />
  );
};

export default Input;
