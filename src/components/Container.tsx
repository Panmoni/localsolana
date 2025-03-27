import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container component for consistent layout across the application
 * Provides responsive padding and max-width constraints
 */
export const Container: React.FC<ContainerProps> = ({ children, className = "" }) => {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl ${className}`}>
      {children}
    </div>
  );
};

export default Container;
