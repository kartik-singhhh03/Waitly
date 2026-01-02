import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useProject, 
  useWaitlistEntries, 
  useWaitlistStats,
  useUpdateProject,
  useRotateApiKey,
  useDeleteWaitlistEntry,
  usePurgeWaitlist,
  useDeleteProject
} from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SignupTrendsChart } from '@/components/SignupTrendsChart';
import {
  Rocket, ArrowLeft, Users, TrendingUp, Copy, RefreshCw,
  Download, Trash2, Settings, Code2, Loader2, AlertTriangle,
  Shield, Eye, EyeOff, Pause, Play, BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: project, isLoading: projectLoading } = useProject(projectId || '');
  const { data: entries, isLoading: entriesLoading } = useWaitlistEntries(projectId || '');
  const { data: stats } = useWaitlistStats(projectId || '');
  
  const updateProject = useUpdateProject();
  const rotateApiKey = useRotateApiKey();
  const deleteEntry = useDeleteWaitlistEntry();
  const purgeWaitlist = usePurgeWaitlist();
  const deleteProject = useDeleteProject();

  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`
    });
  };

  const exportCSV = () => {
    if (!entries || entries.length === 0) {
      toast({
        title: 'No data',
        description: 'No entries to export',
        variant: 'destructive'
      });
      return;
    }

    const headers = ['Email', 'Joined At', 'Referral Code', 'Referred By', 'Priority Score'];
    const csvContent = [
      headers.join(','),
      ...entries.map(e => [
        e.email,
        new Date(e.joined_at).toISOString(),
        e.referral_code,
        e.referred_by || '',
        e.priority_score
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.slug}-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: `Exported ${entries.length} entries`
    });
  };

  const exportAuthFormat = (format: 'supabase' | 'firebase' | 'clerk') => {
    if (!entries || entries.length === 0) {
      toast({
        title: 'No data',
        description: 'No entries to export',
        variant: 'destructive'
      });
      return;
    }

    let content: string;
    let filename: string;

    switch (format) {
      case 'supabase':
        content = JSON.stringify({
          users: entries.map(e => ({
            email: e.email,
            created_at: e.joined_at,
            email_confirmed_at: e.joined_at
          }))
        }, null, 2);
        filename = 'supabase-auth-import.json';
        break;
      case 'firebase':
        content = JSON.stringify({
          users: entries.map(e => ({
            localId: e.id,
            email: e.email,
            createdAt: new Date(e.joined_at).getTime().toString(),
            emailVerified: true
          }))
        }, null, 2);
        filename = 'firebase-auth-import.json';
        break;
      case 'clerk':
        content = JSON.stringify(entries.map(e => ({
          email_addresses: [{ email_address: e.email, verified: true }],
          created_at: new Date(e.joined_at).getTime()
        })), null, 2);
        filename = 'clerk-auth-import.json';
        break;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: `Exported in ${format} format`
    });
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    await deleteProject.mutateAsync(projectId);
    navigate('/dashboard');
  };

  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Project not found</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Use same API URL logic as api.ts for consistency
  const API_BASE = import.meta.env.VITE_API_URL || 
    (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:3001');
  const apiEndpoint = `${API_BASE}/api/subscribe`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{project.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {project.is_frozen && (
              <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                Paused
              </span>
            )}
            {project.privacy_mode && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Privacy-first
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Signups</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.total || 0}</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.today || 0}</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-muted-foreground">Mode</span>
            </div>
            <p className="text-lg font-semibold text-foreground capitalize">{project.mode.replace('_', ' ')}</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-muted-foreground">Status</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {project.is_frozen ? 'Paused' : 'Active'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="entries">Entries</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* API Key Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">API Key</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-lg px-4 py-2 font-mono text-sm">
                  {showApiKey ? project.api_key : '••••••••••••••••••••••••'}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(project.api_key, 'API key')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rotate API Key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will invalidate your current API key. Any integrations using the old key will stop working.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => rotateApiKey.mutate(project.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Rotate Key
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => updateProject.mutate({ id: project.id, is_frozen: !project.is_frozen })}
                  disabled={updateProject.isPending}
                >
                  {project.is_frozen ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume Waitlist
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Waitlist
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('integration')}
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  View Integration
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <SignupTrendsChart entries={entries || []} days={30} />
          </TabsContent>

          <TabsContent value="entries" className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Waitlist Entries ({entries?.length || 0})
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Purge All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Purge All Entries?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {entries?.length || 0} entries from your waitlist. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => purgeWaitlist.mutate(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Purge All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              {entriesLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : entries && entries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(entry.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {entry.referral_code}
                          </code>
                        </TableCell>
                        <TableCell>{entry.priority_score}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteEntry.mutate({ 
                              entryId: entry.id, 
                              projectId: project.id 
                            })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No entries yet. Share your waitlist to start collecting signups!
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <IntegrationSnippets apiKey={project.api_key} apiEndpoint={apiEndpoint} projectId={project.id} projectSlug={project.slug} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Project Settings */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Project Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">Waitlist Mode</label>
                    <p className="text-sm text-muted-foreground">How to order the waitlist</p>
                  </div>
                  <Select
                    value={project.mode}
                    onValueChange={(value: 'fifo' | 'random' | 'score_based' | 'manual') => 
                      updateProject.mutate({ id: project.id, mode: value })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fifo">First Come</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="score_based">Score Based</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">Show Position</label>
                    <p className="text-sm text-muted-foreground">Show exact position or tier</p>
                  </div>
                  <Switch
                    checked={project.show_position}
                    onCheckedChange={(checked) => 
                      updateProject.mutate({ id: project.id, show_position: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">Privacy Mode</label>
                    <p className="text-sm text-muted-foreground">No cookies, no tracking</p>
                  </div>
                  <Switch
                    checked={project.privacy_mode}
                    onCheckedChange={(checked) => 
                      updateProject.mutate({ id: project.id, privacy_mode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">Freeze Waitlist</label>
                    <p className="text-sm text-muted-foreground">Stop accepting new signups</p>
                  </div>
                  <Switch
                    checked={project.is_frozen}
                    onCheckedChange={(checked) => 
                      updateProject.mutate({ id: project.id, is_frozen: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Auth Export */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Auth Migration Export</h3>
              <p className="text-sm text-muted-foreground">
                Export your waitlist in formats compatible with popular auth providers
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => exportAuthFormat('supabase')}>
                  Export for Supabase
                </Button>
                <Button variant="outline" onClick={() => exportAuthFormat('firebase')}>
                  Export for Firebase
                </Button>
                <Button variant="outline" onClick={() => exportAuthFormat('clerk')}>
                  Export for Clerk
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Danger Zone</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Once you delete a project, there is no going back.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{project.name}" and all its waitlist entries. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Integration Snippets Component
const IntegrationSnippets = ({ apiKey, apiEndpoint, projectId, projectSlug }: { 
  apiKey: string; 
  apiEndpoint: string;
  projectId: string;
  projectSlug: string;
}) => {
  const { toast } = useToast();
  const [activeSnippet, setActiveSnippet] = useState('embed');

  // Get the current domain for embed script
  const embedDomain = window.location.origin;

  const snippets = {
    embed: `<!-- One-line embed - just add this to your HTML -->
<script 
  src="${embedDomain}/embed.js" 
  data-project="${projectSlug}"
  data-api-key="${apiKey}"
></script>

<!-- Optional: Customize with attributes -->
<script 
  src="${embedDomain}/embed.js" 
  data-project="${projectSlug}"
  data-api-key="${apiKey}"
  data-theme="dark"
  data-button-text="Join the Waitlist"
  data-placeholder="your@email.com"
></script>

<!-- Or specify a container -->
<div id="my-waitlist"></div>
<script 
  src="${embedDomain}/embed.js" 
  data-project="${projectSlug}"
  data-api-key="${apiKey}"
  data-container="my-waitlist"
></script>`,
    react: `import { useState } from 'react';

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '' });
    
    try {
      const res = await fetch('${apiEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: '${apiKey}',
          email: email
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus({ loading: false, message: \`You're #\${data.position} on the waitlist!\` });
        setEmail('');
      } else {
        setStatus({ loading: false, message: data.error });
      }
    } catch (err) {
      setStatus({ loading: false, message: 'Something went wrong' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={status.loading}>
        {status.loading ? 'Joining...' : 'Join Waitlist'}
      </button>
      {status.message && <p>{status.message}</p>}
    </form>
  );
}`,
    nextjs: `'use client';
import { useState } from 'react';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ loading: boolean; message: string }>({ 
    loading: false, 
    message: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, message: '' });
    
    try {
      const res = await fetch('${apiEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: '${apiKey}',
          email
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus({ 
          loading: false, 
          message: \`You're #\${data.position} on the waitlist!\` 
        });
        setEmail('');
      } else {
        setStatus({ loading: false, message: data.error });
      }
    } catch {
      setStatus({ loading: false, message: 'Something went wrong' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-4 py-2 border rounded-lg"
        required
      />
      <button 
        type="submit" 
        disabled={status.loading}
        className="px-6 py-2 bg-black text-white rounded-lg"
      >
        {status.loading ? 'Joining...' : 'Join Waitlist'}
      </button>
      {status.message && <p className="mt-2">{status.message}</p>}
    </form>
  );
}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Join Our Waitlist</title>
</head>
<body>
  <form id="waitlist-form">
    <input 
      type="email" 
      id="email" 
      placeholder="Enter your email" 
      required 
    />
    <button type="submit">Join Waitlist</button>
    <p id="message"></p>
  </form>

  <script>
    document.getElementById('waitlist-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const message = document.getElementById('message');
      
      try {
        const res = await fetch('${apiEndpoint}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: '${apiKey}',
            email: email
          })
        });
        
        const data = await res.json();
        
        if (data.success) {
          message.textContent = "You're #" + data.position + " on the waitlist!";
          document.getElementById('email').value = '';
        } else {
          message.textContent = data.error;
        }
      } catch (err) {
        message.textContent = 'Something went wrong';
      }
    });
  </script>
</body>
</html>`,
    fetch: `// JavaScript Fetch API Example
const response = await fetch('${apiEndpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    apiKey: '${apiKey}',
    email: 'user@example.com',
    ref: 'optional_referral_code' // Optional
  })
});

const data = await response.json();

// Success response:
// { success: true, position: 124, referralCode: 'abc123' }

// Error response:
// { success: false, error: 'Error message' }`
  };

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Code snippet copied to clipboard'
    });
  };

  const snippetLabels: Record<string, string> = {
    embed: 'Embed Script',
    react: 'React',
    nextjs: 'Next.js',
    html: 'HTML',
    fetch: 'Fetch API'
  };

  return (
    <div className="space-y-6">
      {/* Embed Script Highlight */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              One-Line Embed
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a beautiful waitlist form to any website with a single script tag. No frameworks required.
            </p>
            <div className="bg-background/80 rounded-lg p-3 font-mono text-sm overflow-x-auto">
              <code className="text-primary">{`<script src="${embedDomain}/embed.js" data-project="${projectSlug}"></script>`}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => copySnippet(`<script src="${embedDomain}/embed.js" data-project="${projectSlug}"></script>`)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Embed Code
            </Button>
          </div>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Integration Snippets</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Copy-paste code to add a waitlist to your site in under 5 minutes
          </p>
        </div>

        <div className="border-b border-border">
          <div className="flex gap-1 p-2 overflow-x-auto">
            {Object.keys(snippets).map((key) => (
              <button
                key={key}
                onClick={() => setActiveSnippet(key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeSnippet === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {snippetLabels[key] || key}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={() => copySnippet(snippets[activeSnippet as keyof typeof snippets])}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <pre className="p-4 overflow-x-auto text-sm bg-muted/50 max-h-96">
            <code className="text-foreground">
              {snippets[activeSnippet as keyof typeof snippets]}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
