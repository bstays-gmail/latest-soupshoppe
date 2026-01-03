import { format, parseISO } from 'date-fns';
import { useMenuStore, useHydrated } from '@/lib/store';
import { MenuCard } from '@/components/ui/menu-card';
import { Layout } from '@/components/layout';
import { AlertCircle, CalendarDays, UtensilsCrossed, MapPin, Phone, Clock, UtensilsCrossed as Utensils, ArrowRight, Loader2, Printer } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContactForm } from '@/components/contact-form';
import { AnnouncementOverlay } from '@/components/announcement-overlay';
import { Link, useSearch } from 'wouter';
import { useDailyMenu } from '@/hooks/use-daily-menu';

export default function Home() {
  const hydrated = useHydrated();
  const items = useMenuStore(state => state.items);
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const dateParam = urlParams.get('date');
  const menuDate = dateParam ? parseISO(dateParam) : new Date();
  const isPreviewMode = dateParam !== null;
  const { data: menu, isLoading } = useDailyMenu(menuDate, hydrated);
  const isPublished = menu?.isPublished ?? false;

  const getFreshItem = (item: any) => {
    if (!item) return null;
    const freshItem = items.find(i => i.id === item.id);
    return freshItem || item;
  };

  const activeSoups = (menu?.soups ?? []).filter(Boolean).map(getFreshItem).filter(Boolean);

  return (
    <Layout>
      <AnnouncementOverlay />
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-8 sm:py-12 lg:py-16">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight">
              Welcome to <span className="text-primary">Soup Shoppe</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Fresh, homemade soups, artisanal sandwiches, and garden-fresh salads made daily with love
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <a href="#today-menu" className="inline-block">
              <Button className="gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                View Today's Menu
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="/print-menu" className="inline-block">
              <Button variant="outline" className="gap-2 px-6 font-medium" data-testid="button-download-menu">
                <Printer className="h-4 w-4" />
                Download / Print Menu
              </Button>
            </a>
            <Link href="/catering">
              <Button variant="outline" className="gap-2 px-6 font-medium">
                Catering Services
                <Utensils className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Today's Specials / Menu Section */}
        {(isPublished || isPreviewMode) && (
          <section id="today-menu" className="space-y-8">
            <div className="text-center space-y-3">
              <div className="flex flex-wrap justify-center gap-3">
                <a href="https://soup-shoppe-warren.cloveronline.com/menu/all" target="_blank" rel="noopener noreferrer" className="inline-block">
                  <Button className="gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium" data-testid="button-order-now">
                    Order Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                <CalendarDays className="h-4 w-4 mr-2" />
                {format(menuDate, 'EEEE, MMMM do, yyyy')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">
                Today's Specials
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Freshly prepared daily using the finest ingredients and time-tested recipes
              </p>
            </div>

            {/* Soups Grid */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-serif font-bold text-primary shrink-0">Daily Soups</h3>
                <div className="h-px bg-border flex-1" />
              </div>
              
              {activeSoups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSoups.map((soup) => (
                    <MenuCard key={soup!.id} item={soup!} highlight />
                  ))}
                </div>
              ) : (
                <Alert variant="default" className="bg-muted/50 border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No soups listed yet</AlertTitle>
                  <AlertDescription>
                    We might be sold out or updating the board. Ask our staff!
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Specials Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-serif font-bold text-primary shrink-0">Featured Items</h3>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {menu?.specials?.panini && getFreshItem(menu.specials.panini) && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Hot Panini</span>
                    <MenuCard item={getFreshItem(menu.specials.panini)!} />
                  </div>
                )}
                
                {menu?.specials?.sandwich && getFreshItem(menu.specials.sandwich) && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Signature Sandwich</span>
                    <MenuCard item={getFreshItem(menu.specials.sandwich)!} />
                  </div>
                )}

                {menu?.specials?.salad && getFreshItem(menu.specials.salad) && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Featured Salad</span>
                    <MenuCard item={getFreshItem(menu.specials.salad)!} />
                  </div>
                )}

                {menu?.specials?.entree && getFreshItem(menu.specials.entree) && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Dinner Entrée</span>
                    <MenuCard item={getFreshItem(menu.specials.entree)!} highlight />
                  </div>
                )}
              </div>

              {!menu?.specials?.panini && !menu?.specials?.sandwich && !menu?.specials?.salad && !menu?.specials?.entree && (
                <div className="text-center py-12 text-muted-foreground italic font-serif">
                  Check the board in-store for additional daily specials!
                </div>
              )}
            </div>
          </section>
        )}

        {!isPublished && !isPreviewMode && (
          <section className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto space-y-6">
            <div className="bg-secondary/30 p-8 rounded-full">
              <UtensilsCrossed className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-primary">The Pot is Simmering...</h2>
              <p className="text-muted-foreground leading-relaxed">
                We haven't posted today's menu just yet. The chefs are busy preparing something delicious. 
                Please check back in a few minutes!
              </p>
            </div>
          </section>
        )}

        {/* Catering Services */}
        <section id="catering" className="py-12 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/10">
          <div className="max-w-2xl mx-auto text-center space-y-6 px-4">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">
              Catering Services
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Perfect for corporate events, parties, and special occasions. We bring the flavors of Soup Shoppe to you.
            </p>
            <Link href="/catering">
              <Button className="gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Online Ordering */}
        <section className="py-12 bg-gradient-to-br from-accent/5 to-primary/5 rounded-lg border border-accent/10">
          <div className="max-w-2xl mx-auto text-center space-y-6 px-4">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">
              Online Ordering
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Order your favorite soups, sandwiches, and salads for pickup or delivery. Fresh and ready when you are.
            </p>
            <a href="https://soup-shoppe-warren.cloveronline.com/menu/all" target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button className="gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                Order Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </section>

        {/* Contact Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8">
          <ContactForm />

          {/* Visit Us Card */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-primary">Visit Us</h2>
            
            <Card className="p-8 space-y-6 border-primary/10">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-serif font-bold text-foreground mb-1">Location</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      665 Martinsville Rd<br />
                      Basking Ridge, NJ 07920
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-serif font-bold text-foreground mb-1">Phone</h4>
                    <p className="text-sm text-muted-foreground">
                      <a href="tel:908-604-2000" className="hover:text-primary transition-colors">908-604-2000</a>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Call for daily specials
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-serif font-bold text-foreground mb-1">Hours</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Monday - Saturday: 9:00 AM - 5:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
