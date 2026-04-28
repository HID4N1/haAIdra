import React from 'react';
import { motion } from 'framer-motion';

export const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};
