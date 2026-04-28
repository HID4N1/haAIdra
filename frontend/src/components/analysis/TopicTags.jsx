import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';
import { formatNumber } from '../../lib/utils';

export const TopicTags = ({ topics = [] }) => {
  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No topics detected</p>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    if (confidence >= 0.6) return 'bg-primary-100 text-primary-800 border-primary-200';
    if (confidence >= 0.4) return 'bg-warning-100 text-warning-800 border-warning-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConfidenceSize = (confidence) => {
    if (confidence >= 0.8) return 'text-base px-4 py-2';
    if (confidence >= 0.6) return 'text-sm px-3 py-1.5';
    return 'text-xs px-2 py-1';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Detected Topics</h3>
      
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.name}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              'inline-flex items-center rounded-full border font-medium',
              getConfidenceColor(topic.confidence),
              getConfidenceSize(topic.confidence)
            )}
          >
            <span>{topic.name}</span>
            <span className="ml-2 text-xs opacity-75">
              {formatNumber(topic.confidence * 100, 0)}%
            </span>
          </motion.div>
        ))}
      </div>

      {/* Topic Details */}
      <div className="space-y-3">
        {topics
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5)
          .map((topic, index) => (
            <motion.div
              key={topic.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{topic.name}</h4>
                <span className="text-sm font-medium text-gray-500">
                  {formatNumber(topic.confidence * 100, 1)}% confidence
                </span>
              </div>
              
              {/* Confidence Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${topic.confidence * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={cn(
                    'h-2 rounded-full',
                    topic.confidence >= 0.8 ? 'bg-secondary-500' :
                    topic.confidence >= 0.6 ? 'bg-primary-500' :
                    topic.confidence >= 0.4 ? 'bg-warning-500' :
                    'bg-gray-500'
                  )}
                />
              </div>

              {/* Topic Description */}
              {topic.description && (
                <p className="text-sm text-gray-600">{topic.description}</p>
              )}

              {/* Topic Keywords */}
              {topic.keywords && topic.keywords.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {topic.keywords.map((keyword, kIndex) => (
                      <span
                        key={kIndex}
                        className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
      </div>
    </div>
  );
};

export const TopicTagsSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-32" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-20 rounded-full" />
      ))}
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6 mt-1" />
        </div>
      ))}
    </div>
  </div>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');
