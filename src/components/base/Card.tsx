
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({ 
  children, 
  hover = false, 
  padding = 'md', 
  className = '', 
  ...props 
}: CardProps) {
  const baseClasses = 'bg-white rounded-xl shadow-lg border border-gray-200/50 transition-all duration-300';
  const hoverClasses = hover ? 'hover:shadow-2xl hover:scale-[1.02] cursor-pointer' : '';
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
