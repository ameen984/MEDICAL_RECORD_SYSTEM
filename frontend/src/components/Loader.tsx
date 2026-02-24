import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', color = 'primary', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <div className={clsx('flex justify-center items-center', className)}>
      <Loader2
        className={clsx(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
    </div>
  );
};

export default Loader;
