import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AnnouncementSettings } from '@shared/schema';

export function AnnouncementOverlay() {
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/announcement')
      .then(res => res.json())
      .then((data: AnnouncementSettings) => {
        if (!data.enabled || !data.message) {
          setIsLoading(false);
          return;
        }
        
        const contentKey = `dismissed-${data.title}-${data.message.slice(0, 20)}`;
        const wasDismissed = sessionStorage.getItem(contentKey) === 'true';
        
        if (wasDismissed) {
          setDismissed(true);
        }
        
        setSettings(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (settings) {
      const contentKey = `dismissed-${settings.title}-${settings.message.slice(0, 20)}`;
      sessionStorage.setItem(contentKey, 'true');
    }
  };

  if (isLoading || dismissed || !settings?.enabled || !settings?.message) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: settings.backgroundColor || 'rgba(0, 0, 0, 0.85)' }}
      data-testid="announcement-overlay"
    >
      <div className="relative max-w-lg w-full bg-card rounded-lg shadow-2xl border border-border overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 hover:bg-muted"
          onClick={handleDismiss}
          data-testid="button-close-announcement"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close announcement</span>
        </Button>
        
        <div className="p-8 sm:p-10 text-center space-y-4">
          {settings.title && (
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              {settings.title}
            </h2>
          )}
          <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {settings.message}
          </p>
        </div>
      </div>
    </div>
  );
}
