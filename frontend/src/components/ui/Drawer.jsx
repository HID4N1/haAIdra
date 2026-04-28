import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export const Drawer = ({
  children,
  isOpen,
  onClose,
  size = 'md',
  position = 'right',
  className,
  closeOnOverlayClick = true,
  ...props
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: position === 'right' || position === 'left' ? 'w-80' : 'h-80',
    md: position === 'right' || position === 'left' ? 'w-96' : 'h-96',
    lg: position === 'right' || position === 'left' ? 'w-[32rem]' : 'h-[32rem]',
    xl: position === 'right' || position === 'left' ? 'w-[48rem]' : 'h-[48rem]',
    full: position === 'right' || position === 'left' ? 'w-full' : 'h-full',
  };

  const positionClasses = {
    right: 'right-0 top-0 h-full',
    left: 'left-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };

  const slideVariants = {
    right: { initial: { x: '100%' }, animate: { x: 0 } },
    left: { initial: { x: '-100%' }, animate: { x: 0 } },
    top: { initial: { y: '-100%' }, animate: { y: 0 } },
    bottom: { initial: { y: '100%' }, animate: { y: 0 } },
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const drawer = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex"
          onClick={handleOverlayClick}
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            className={cn(
              'relative bg-white shadow-xl',
              sizeClasses[size],
              positionClasses[position],
              className
            )}
            initial={slideVariants[position].initial}
            animate={slideVariants[position].animate}
            exit={slideVariants[position].initial}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawer, document.body);
};

export const DrawerHeader = ({ children, onClose, className, ...props }) => (
  <div className={cn('flex items-center justify-between p-6 pb-0', className)} {...props}>
    <div className="flex-1">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

export const DrawerBody = ({ className, ...props }) => (
  <div className={cn('p-6 overflow-y-auto flex-1', className)} {...props} />
);

export const DrawerFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center justify-end gap-3 p-6 pt-0 border-t', className)} {...props} />
);
