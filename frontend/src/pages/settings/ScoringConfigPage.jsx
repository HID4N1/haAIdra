import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useScoringConfig, useUpdateScoring } from '../../hooks/useScoring';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatNumber } from '../../lib/utils';

const scoringDimensions = [
  { key: 'accueil', label: 'Accueil', description: 'Greeting and welcome quality' },
  { key: 'empathie', label: 'Empathie', description: 'Empathy and understanding' },
  { key: 'resolution', label: 'Resolution', description: 'Problem resolution effectiveness' },
  { key: 'langage', label: 'Langage', description: 'Language and communication' },
  { key: 'conformite', label: 'Conformité', description: 'Compliance and procedures' },
  { key: 'cloture', label: 'Clôture', description: 'Call closure and follow-up' },
];

export const ScoringConfigPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { data: config, isLoading } = useScoringConfig(user?.company);
  const updateScoringMutation = useUpdateScoring(user?.company);

  const [weights, setWeights] = useState({
    accueil: 0.20,
    empathie: 0.20,
    resolution: 0.20,
    langage: 0.20,
    conformite: 0.10,
    cloture: 0.10,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setWeights({
        accueil: config.accueil || 0.20,
        empathie: config.empathie || 0.20,
        resolution: config.resolution || 0.20,
        langage: config.langage || 0.20,
        conformite: config.conformite || 0.10,
        cloture: config.cloture || 0.10,
      });
    }
  }, [config]);

  const handleWeightChange = (dimension, value) => {
    const newWeight = Math.max(0, Math.min(1, parseFloat(value) || 0));
    setWeights(prev => ({
      ...prev,
      [dimension]: newWeight
    }));
    setHasChanges(true);
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const isValid = Math.abs(totalWeight - 1.0) < 0.01;

  const handleSave = async () => {
    if (!isValid) {
      error('Weights must sum to exactly 1.0');
      return;
    }

    try {
      await updateScoringMutation.mutateAsync(weights);
      success('Scoring configuration updated successfully');
      setHasChanges(false);
    } catch (err) {
      error('Failed to update scoring configuration');
    }
  };

  const handleReset = () => {
    const defaultWeights = {
      accueil: 0.20,
      empathie: 0.20,
      resolution: 0.20,
      langage: 0.20,
      conformite: 0.10,
      cloture: 0.10,
    };
    setWeights(defaultWeights);
    setHasChanges(true);
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scoring Configuration</h1>
        <p className="text-gray-500">Configure quality assessment scoring weights</p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Scoring Weights</CardTitle>
            <div className="flex items-center space-x-2">
              <div className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                isValid ? 'bg-secondary-100 text-secondary-800' : 'bg-danger-100 text-danger-800'
              )}>
                Total: {formatNumber(totalWeight, 2)}
                {isValid ? ' ✓' : ' ✗'}
              </div>
              {hasChanges && (
                <span className="text-sm text-warning-600 font-medium">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sliders */}
            {scoringDimensions.map((dimension, index) => (
              <motion.div
                key={dimension.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {dimension.label}
                      </h3>
                      <p className="text-xs text-gray-500">{dimension.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={weights[dimension.key]}
                        onChange={(e) => handleWeightChange(dimension.key, e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="text-sm text-gray-500">
                        ({formatNumber(weights[dimension.key] * 100, 0)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={weights[dimension.key]}
                      onChange={(e) => handleWeightChange(dimension.key, e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div
                      className="absolute top-0 left-0 h-2 bg-primary-500 rounded-lg pointer-events-none"
                      style={{ width: `${weights[dimension.key] * 100}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Validation Message */}
            {!isValid && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-danger-50 border border-danger-200 rounded-md p-3"
              >
                <p className="text-sm text-danger-800">
                  Weights must sum to exactly 1.0 (100%). Current total: {formatNumber(totalWeight, 2)}
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={updateScoringMutation.isPending}
              >
                Reset to Default
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (config) {
                      setWeights({
                        accueil: config.accueil || 0.20,
                        empathie: config.empathie || 0.20,
                        resolution: config.resolution || 0.20,
                        langage: config.langage || 0.20,
                        conformite: config.conformite || 0.10,
                        cloture: config.cloture || 0.10,
                      });
                      setHasChanges(false);
                    }
                  }}
                  disabled={updateScoringMutation.isPending || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={updateScoringMutation.isPending}
                  disabled={!hasChanges || !isValid}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-blue-50 rounded-lg p-6"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800">About Scoring Weights</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                Scoring weights determine how each dimension contributes to the overall quality score. 
                All weights must sum to exactly 1.0 (100%).
              </p>
              <p>
                Changes will apply to all new analyses going forward. Existing call scores will not be affected.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PageSkeleton = () => (
  <div className="space-y-6">
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-64 bg-gray-200 rounded"></div>
    </div>
    
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-3 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');
