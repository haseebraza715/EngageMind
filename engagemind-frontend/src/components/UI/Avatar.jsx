import React, { useEffect, useState } from 'react';

const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'md',
  name,
  className = '',
  ...props
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const baseClasses = `rounded-full flex items-center justify-center overflow-hidden shrink-0 font-semibold shadow-md ${sizes[size]} ${className}`;

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${baseClasses} object-cover border-2 border-white`}
        onError={() => setImageFailed(true)}
        {...props}
      />
    );
  }

  return (
    <div
      className={`${baseClasses} bg-gradient-to-br from-teal-400 to-blue-500 text-white border-2 border-white`}
      {...props}
    >
      {getInitials(name || alt)}
    </div>
  );
};

export default Avatar;
