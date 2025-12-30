import React from 'react';

const LoadingSpinner = ({ size = 'md', overlay = false, text = '' }) => {
  const sizes = {
    sm: 'h-8 w-8 border-2',
    md: 'h-16 w-16 border-4',
    lg: 'h-24 w-24 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`animate-spin rounded-full ${sizes[size]} border-t-teal-500 border-b-teal-500 border-l-transparent border-r-transparent`}></div>
      {text && <p className="text-gray-600 font-medium">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/60 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;