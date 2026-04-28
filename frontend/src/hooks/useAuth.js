import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login as loginApi, logout as logoutApi, getUser } from '../lib/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: getUser,
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => loginApi(email, password),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(['auth', 'user'], data.user);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const login = async (email, password) => {
    return await loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userQuery.data,
    login,
    logout,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
  };
};