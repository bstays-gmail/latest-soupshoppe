import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ShieldCheck, Instagram, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
const logoImage = 'https://res.cloudinary.com/dlcrh8uee/image/upload/v1767034251/soup-shoppe-menu/soup-shoppe-logo.png';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={logoImage} alt="Soup Shoppe" className="h-16 w-auto transition-transform group-hover:scale-105" />
            </Link>
            <a
              href="https://instagram.com/soup.shoppe"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
              title="Follow us on Instagram"
            >
              <div className="p-2">
                <Instagram className="h-6 w-6" style={{
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }} />
              </div>
            </a>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/" className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location === '/' ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              Today's Menu
            </Link>
            {user ? (
              <>
                <Link href="/admin" className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground",
                  location === '/admin' ? "bg-secondary text-secondary-foreground border-secondary" : "text-muted-foreground border-transparent"
                )}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t bg-muted/30 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="space-y-6">
            <div className="text-center">
              <p className="font-serif italic text-lg mb-4 text-primary">"Good soup is one of the prime ingredients of good living."</p>
            </div>
            
            <div className="flex justify-center">
              <a
                href="https://instagram.com/soup.shoppe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-sm font-medium">Follow us @Soup.shoppe</span>
              </a>
            </div>

            <p className="text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} The Soup Shoppe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
