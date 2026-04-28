# API Integration Guide

This guide shows how to replace mock data with real API calls in the haAidra frontend.

## 🔄 Converting Mock Data to API Calls

### Step 1: Create API Hooks

First, create a hook file in `src/hooks/` for your API endpoints:

```javascript
// src/hooks/useYourFeature.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/Toast';

// GET data hook
export const useYourFeature = (params = {}) => {
  return useQuery({
    queryKey: ['your-feature', params],
    queryFn: async () => {
      const { data } = await api.get('/your-endpoint/', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// POST/PUT/DELETE mutation hook
export const useCreateYourFeature = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (featureData) => {
      const { data } = await api.post('/your-endpoint/', featureData);
      return data;
    },
    onSuccess: (data) => {
      success('Feature created successfully');
      queryClient.invalidateQueries({ queryKey: ['your-feature'] });
      return data;
    },
    onError: (err) => {
      error('Failed to create feature');
      throw err;
    },
  });
};
```

### Step 2: Update Component

Replace mock data in your component:

```javascript
// BEFORE (Mock Data)
const mockData = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];

const data = mockData;

// AFTER (Real API)
import { useYourFeature } from '../hooks/useYourFeature';

export const YourComponent = () => {
  const { data, isLoading, error } = useYourFeature();

  if (isLoading) return <PageSpinner />;
  if (error) return <div>Error loading data</div>;

  const items = data?.results || [];
  
  return (
    // Your JSX with items
  );
};
```

## 📋 Completed Examples

### 1. Analytics Page (`ManagerAnalyticsPage.jsx`)

**Created:** `src/hooks/useAnalytics.js`
- `useAnalytics()` - Main analytics data
- `usePerformanceTrends()` - Performance trends
- `useAgentPerformance()` - Agent performance
- `useChannelDistribution()` - Channel distribution
- `useSentimentAnalysis()` - Sentiment analysis
- `useQualityMetrics()` - Quality metrics

**Updated:** Component now uses real API calls instead of `mockAnalyticsData`

### 2. Companies Page (`CompaniesPage.jsx`)

**Created:** `src/hooks/useCompanies.js`
- `useCompanies()` - List companies with pagination
- `useCompany()` - Single company details
- `useCreateCompany()` - Create new company
- `useUpdateCompany()` - Update company
- `useToggleCompanyStatus()` - Toggle company status
- `useDeleteCompany()` - Delete company
- `useCompanyStats()` - Company statistics

**Updated:** Component now uses real API calls and proper loading states

## 🔧 Common Patterns

### Pagination

```javascript
const { data: paginatedData, isLoading } = useYourFeature({
  page: currentPage,
  page_size: 20
});

const items = paginatedData?.results || [];
const totalPages = Math.ceil((paginatedData?.count || 0) / 20);
```

### Mutations with Form

```javascript
const createMutation = useCreateYourFeature();

const handleSubmit = async (formData) => {
  try {
    await createMutation.mutateAsync(formData);
    // Reset form, close modal, etc.
  } catch (err) {
    // Error handled in hook
  }
};
```

### Loading States

```javascript
const { data, isLoading } = useYourFeature();

if (isLoading) {
  return <PageSpinner />; // or <Skeleton />
}

if (!data) {
  return <div>No data available</div>;
}
```

### Error Handling

```javascript
const { data, isLoading, error } = useYourFeature();

if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-danger-600">Failed to load data</p>
      <Button onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  );
}
```

## 🎯 Next Steps

### Pages Still Using Mock Data

These pages still need API integration:

1. **AgentPage.jsx** - Uses `useCalls({ agent_id: user?.id })` ✅ (already uses API)
2. **AdminUsersPage.jsx** - Uses `useUsers()` ✅ (already uses API)
3. **ManagerDashboardPage.jsx** - Uses dashboard hooks ✅ (already uses API)
4. **AgentCallDetailPage.jsx** - Uses analysis hooks ✅ (already uses API)

### Backend API Endpoints Needed

Your backend should provide these endpoints:

```
GET /api/v1/analytics/
GET /api/v1/analytics/performance-trends/
GET /api/v1/analytics/agent-performance/
GET /api/v1/analytics/channel-distribution/
GET /api/v1/analytics/sentiment-analysis/
GET /api/v1/analytics/quality-metrics/

GET /api/v1/companies/
POST /api/v1/companies/
PATCH /api/v1/companies/{id}/
DELETE /api/v1/companies/{id}/
POST /api/v1/companies/{id}/toggle-status/
GET /api/v1/companies/stats/
```

## 🚀 Testing

To test with mock data while backend is being developed:

```javascript
// In your hook, temporarily return mock data
export const useYourFeature = () => {
  return useQuery({
    queryKey: ['your-feature'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockData;
    },
    staleTime: 5 * 60 * 1000,
  });
};
```

Then replace with real API call when backend is ready.

## 💡 Tips

1. **Always include loading states** - Use `<PageSpinner />` or `<Skeleton />`
2. **Handle errors gracefully** - Show user-friendly error messages
3. **Use proper cache keys** - Include parameters in queryKey
4. **Invalidate cache on mutations** - Keep data fresh
5. **Use TypeScript** - Add proper types for better development experience

---

This pattern ensures consistent API integration across all pages while maintaining good UX with loading states and error handling.
