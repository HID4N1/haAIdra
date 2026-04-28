import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatNumber, formatPercentage } from '../../lib/utils';

export const KPICard = ({ title, value, subtitle, trend, icon, loading, color = 'primary' }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-500',
    },
    secondary: {
      bg: 'bg-secondary-50',
      text: 'text-secondary-600',
      icon: 'text-secondary-500',
    },
    danger: {
      bg: 'bg-danger-50',
      text: 'text-danger-600',
      icon: 'text-danger-500',
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      icon: 'text-warning-500',
    },
  };

  const currentColor = colorClasses[color];

  if (loading) {
    return <KPICardSkeleton />;
  }

  const AnimatedNumber = ({ value, decimals = 0 }) => {
    const [displayValue, setDisplayValue] = React.useState(0);
    const targetValue = parseFloat(value) || 0;

    React.useEffect(() => {
      const duration = 1000;
      const steps = 30;
      const increment = (targetValue - displayValue) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(targetValue);
          clearInterval(timer);
        } else {
          setDisplayValue(prev => prev + increment);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [targetValue]);

    return (
      <span className={currentColor.text}>
        {formatNumber(displayValue, decimals)}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-baseline space-x-2 mt-1">
                <p className={`text-2xl font-bold ${currentColor.text}`}>
                  {typeof value === 'number' ? (
                    <AnimatedNumber value={value} decimals={title.includes('Score') ? 2 : 0} />
                  ) : (
                    value
                  )}
                </p>
                {title.includes('Rate') && (
                  <span className="text-sm text-gray-500">%</span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center mt-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className={cn(
                      'flex items-center text-xs font-medium',
                      trend.value > 0 ? 'text-secondary-600' : 'text-danger-600'
                    )}
                  >
                    {trend.value > 0 ? (
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {formatPercentage(Math.abs(trend.value))}
                    <span className="ml-1 text-gray-500">{trend.period}</span>
                  </motion.div>
                </div>
              )}
            </div>
            
            <div className={cn('p-3 rounded-lg', currentColor.bg)}>
              <div className={cn('w-6 h-6', currentColor.icon)}>
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const KPICardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');
