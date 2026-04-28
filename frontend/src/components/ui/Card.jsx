import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(({
  children,
  className,
  shadow = 'md',
  padding = 'p-6',
  ...props
}, ref) => {
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'bg-white rounded-lg border border-gray-200',
        shadowClasses[shadow],
        padding,
        className
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-gray-500', className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn('pt-0', className)} {...props} />
);

export const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center pt-4', className)} {...props} />
);
