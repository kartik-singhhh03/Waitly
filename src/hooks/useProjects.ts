import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, entriesApi, statsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  api_key: string;
  mode: 'fifo' | 'random' | 'score_based' | 'manual';
  is_frozen: boolean;
  email_confirmation_required: boolean;
  privacy_mode: boolean;
  show_position: boolean;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntry {
  id: string;
  project_id: string;
  email: string;
  referral_code: string;
  referred_by: string | null;
  priority_score: number;
  joined_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await projectsApi.getAll() as Project[];
    },
    enabled: !!user
  });
};

export const useProject = (projectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!user) return null;
      return await projectsApi.getById(projectId) as Project | null;
    },
    enabled: !!user && !!projectId
  });
};

export const useWaitlistEntries = (projectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['waitlist-entries', projectId],
    queryFn: async () => {
      if (!user || !projectId) return [];
      return await entriesApi.getByProject(projectId) as WaitlistEntry[];
    },
    enabled: !!user && !!projectId
  });
};

export const useWaitlistStats = (projectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['waitlist-stats', projectId],
    queryFn: async () => {
      if (!user || !projectId) return { total: 0, today: 0 };
      return await statsApi.getByProject(projectId);
    },
    enabled: !!user && !!projectId
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      if (!user) throw new Error('Not authenticated');
      try {
        return await projectsApi.create(name, slug) as Project;
      } catch (error: any) {
        if (error.message.includes('slug') || error.message.includes('duplicate')) {
          throw new Error('A project with this slug already exists');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project created!',
        description: 'Your new waitlist is ready to go.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create project',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      return await projectsApi.update(id, updates) as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      toast({
        title: 'Project updated',
        description: 'Your changes have been saved.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update project',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useRotateApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      return await projectsApi.rotateApiKey(projectId) as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      toast({
        title: 'API key rotated',
        description: 'Your new API key is ready. Update your integrations.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to rotate API key',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteWaitlistEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ entryId, projectId }: { entryId: string; projectId: string }) => {
      await entriesApi.delete(entryId, projectId);
      return { entryId, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-stats', projectId] });
      toast({
        title: 'Entry removed',
        description: 'The waitlist entry has been deleted.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete entry',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const usePurgeWaitlist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await entriesApi.purge(projectId);
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-stats', projectId] });
      toast({
        title: 'Waitlist purged',
        description: 'All entries have been removed.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to purge waitlist',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await projectsApi.delete(projectId);
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project deleted',
        description: 'The project and all its data have been removed.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete project',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};
