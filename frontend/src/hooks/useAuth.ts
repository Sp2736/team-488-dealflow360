"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/basePath";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export function useCurrentUser() {
  return useQuery<UserProfile | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await apiClient<{ user: UserProfile }>("/api/auth/me");
        return res?.user || null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email?: string; password?: string; persona?: string }) => {
      return apiClient<{ user: UserProfile; message: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
      if (data.user.role === "CUSTOMER") {
        router.push(withBasePath("/portal/quotation"));
      } else {
        router.push(withBasePath("/dashboard"));
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      return apiClient<{ message: string }>("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      router.push(withBasePath("/login"));
    },
  });
}

export function useAuth() {
  const { data: user, isLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  return {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}
