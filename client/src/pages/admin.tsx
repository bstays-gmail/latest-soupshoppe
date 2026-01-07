import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { MenuForm } from '@/components/admin/menu-form';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Settings2, Key, Loader2, Download, Upload, Megaphone, Lightbulb, Phone, FileDown } from 'lucide-react';
import type { AnnouncementSettings, MenuSuggestion, DeliveryEnrollment } from '@shared/schema';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMenuStore } from '@/lib/store';
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Admin() {
  const [date, setDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('menu');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>({
    enabled: false,
    title: '',
    message: '',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    textColor: '#ffffff',
  });
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [suggestions, setSuggestions] = useState<MenuSuggestion[]>([]);
  const [enrollments, setEnrollments] = useState<DeliveryEnrollment[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const resetDatabase = useMenuStore(state => state.resetDatabase);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await apiRequest("GET", "/api/admin/menu-suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
    setLoadingSuggestions(false);
  };

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const res = await apiRequest("GET", "/api/admin/delivery-enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data);
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    }
    setLoadingEnrollments(false);
  };

  const updateSuggestionStatus = async (id: string, status: string) => {
    try {
      const res = await apiRequest("PATCH", `/api/admin/menu-suggestions/${id}`, { status });
      if (res.ok) {
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        toast({ title: "Status updated", description: `Suggestion marked as ${status}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const downloadEnrollmentsCsv = () => {
    window.location.href = '/api/admin/delivery-enrollments/csv';
  };

  useEffect(() => {
    fetch('/api/announcement')
      .then(res => res.json())
      .then(data => setAnnouncement(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'suggestions' && suggestions.length === 0) {
      fetchSuggestions();
    }
    if (activeTab === 'enrollments' && enrollments.length === 0) {
      fetchEnrollments();
    }
  }, [activeTab]);

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
      const res = await apiRequest("POST", "/api/announcement", announcement);
      if (res.ok) {
        toast({ title: "Success", description: "Announcement settings saved" });
        setAnnouncementDialogOpen(false);
      } else {
        toast({ title: "Error", description: "Failed to save announcement", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save announcement", variant: "destructive" });
    }
    setIsSavingAnnouncement(false);
  };

  const handleReset = () => {
    resetDatabase();
    toast({
      title: "Database Reset",
      description: "All items have been restored to factory defaults.",
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await apiRequest("GET", "/api/admin/export-data");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soup-shoppe-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Export Complete", description: `Exported ${data.menus?.length || 0} menus` });
      } else {
        toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const res = await apiRequest("POST", "/api/admin/import-data", data);
      if (res.ok) {
        const result = await res.json();
        toast({ title: "Import Complete", description: result.message });
        window.location.reload();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to import data", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Invalid file format", variant: "destructive" });
    }
    setIsImporting(false);
    event.target.value = '';
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "New passwords don't match", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await apiRequest("POST", "/api/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.ok) {
        toast({ title: "Success", description: "Password changed successfully" });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordDialogOpen(false);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to change password", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    }
    setIsChangingPassword(false);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/60 shadow-sm sticky top-24">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="font-serif text-lg">Control Panel</CardTitle>
              <CardDescription>Select a date to manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Target Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Site Settings</h4>
                <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-announcement">
                      <Megaphone className="mr-2 h-4 w-4" />
                      Announcement Banner
                      {announcement.enabled && (
                        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">ON</span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Announcement Banner</DialogTitle>
                      <DialogDescription>
                        Display a message overlay on the homepage for promotions or closures.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="announcement-enabled">Show Announcement</Label>
                        <Switch
                          id="announcement-enabled"
                          checked={announcement.enabled}
                          onCheckedChange={(checked) => setAnnouncement({ ...announcement, enabled: checked })}
                          data-testid="switch-announcement-enabled"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcement-title">Title (optional)</Label>
                        <Input
                          id="announcement-title"
                          placeholder="e.g., Holiday Closure"
                          value={announcement.title}
                          onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                          data-testid="input-announcement-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcement-message">Message</Label>
                        <Textarea
                          id="announcement-message"
                          placeholder="e.g., We will be closed December 25th for Christmas. Happy Holidays!"
                          value={announcement.message}
                          onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                          rows={4}
                          data-testid="input-announcement-message"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement} data-testid="button-save-announcement">
                        {isSavingAnnouncement ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Announcement
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Account</h4>
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                        {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Change Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Data Sync</h4>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={handleExport}
                  disabled={isExporting}
                  data-testid="button-export"
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export Menus
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isImporting}
                    data-testid="input-import"
                  />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    disabled={isImporting}
                    data-testid="button-import"
                  >
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Import Menus
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 px-2">
                  Export from development, then import in production to sync menus.
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Database Tools</h4>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Reset Database
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete any custom items you've added and restore the default database. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="menu" data-testid="tab-menu">Daily Menu</TabsTrigger>
              <TabsTrigger value="suggestions" data-testid="tab-suggestions" className="relative">
                Suggestions
                {suggestions.filter(s => s.status === 'new').length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{suggestions.filter(s => s.status === 'new').length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="enrollments" data-testid="tab-enrollments">
                Delivery List
                {enrollments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">{enrollments.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu">
              <MenuForm date={date} key={date.toISOString()} />
            </TabsContent>

            <TabsContent value="suggestions">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Menu Suggestions
                      </CardTitle>
                      <CardDescription>Customer suggestions for new menu items</CardDescription>
                    </div>
                    <Button variant="outline" onClick={fetchSuggestions} disabled={loadingSuggestions} data-testid="button-refresh-suggestions">
                      {loadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingSuggestions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No suggestions yet. When customers submit ideas, they'll appear here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suggestions.map(suggestion => (
                        <Card key={suggestion.id} className={cn("border", suggestion.status === 'new' && "border-primary/50 bg-primary/5")}>
                          <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold">{suggestion.itemName}</h4>
                                  <Badge variant="outline">{suggestion.itemType}</Badge>
                                  <Badge variant={suggestion.status === 'new' ? 'default' : suggestion.status === 'implemented' ? 'secondary' : 'outline'}>
                                    {suggestion.status}
                                  </Badge>
                                </div>
                                {suggestion.description && (
                                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  Submitted by {suggestion.guestName}
                                  {suggestion.contactEmail && ` • ${suggestion.contactEmail}`}
                                  {suggestion.contactPhone && ` • ${suggestion.contactPhone}`}
                                  {suggestion.createdAt && ` • ${format(new Date(suggestion.createdAt), 'MMM d, yyyy')}`}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <Select value={suggestion.status} onValueChange={(value) => updateSuggestionStatus(suggestion.id, value)}>
                                  <SelectTrigger className="w-32" data-testid={`select-status-${suggestion.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="implemented">Implemented</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enrollments">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Delivery Enrollments
                      </CardTitle>
                      <CardDescription>Customers signed up for text updates about advance orders</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={fetchEnrollments} disabled={loadingEnrollments} data-testid="button-refresh-enrollments">
                        {loadingEnrollments ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                      </Button>
                      <Button onClick={downloadEnrollmentsCsv} disabled={enrollments.length === 0} data-testid="button-export-csv">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingEnrollments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No enrollments yet. When customers sign up for delivery, they'll appear here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Name</th>
                            <th className="text-left py-2 px-3 font-medium">Phone</th>
                            <th className="text-left py-2 px-3 font-medium">Preferred Time</th>
                            <th className="text-left py-2 px-3 font-medium">Notes</th>
                            <th className="text-left py-2 px-3 font-medium">Enrolled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map(enrollment => (
                            <tr key={enrollment.id} className="border-b last:border-0" data-testid={`row-enrollment-${enrollment.id}`}>
                              <td className="py-2 px-3">{enrollment.guestName}</td>
                              <td className="py-2 px-3">
                                <a href={`tel:${enrollment.phoneNumber}`} className="text-primary hover:underline">
                                  {enrollment.phoneNumber}
                                </a>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">{enrollment.preferredContactWindow || '-'}</td>
                              <td className="py-2 px-3 text-muted-foreground max-w-[200px] truncate">{enrollment.notes || '-'}</td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {enrollment.createdAt && format(new Date(enrollment.createdAt), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
