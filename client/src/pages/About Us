import { Layout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Clock, Users } from 'lucide-react';
import { Link } from 'wouter';

export default function About() {
  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-8 sm:py-12 lg:py-16">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight">
              More Than A <span className="text-primary">Soup</span>...
            </h1>
          </div>
        </section>

        {/* Story Section */}
        <section className="max-w-3xl mx-auto">
          <Card className="p-8 sm:p-12 border-primary/10">
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed" data-testid="text-about-story">
              Soup Shoppe was established in 2002 and has been family owned and operated since. At Soup Shoppe, our goal is to provide the highest quality food at an outstanding value. We use the finest and freshest ingredients available and combine them with our culinary expertise to prepare our signature menu items, as well as our daily specials and all of our catering items.
            </p>
          </Card>
        </section>

        {/* Values Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center space-y-4 border-primary/10">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-lg text-primary">Family Owned</h3>
            <p className="text-sm text-muted-foreground">
              Proudly family owned and operated since 2002
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4 border-primary/10">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-lg text-primary">Fresh Daily</h3>
            <p className="text-sm text-muted-foreground">
              Using the finest and freshest ingredients available
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4 border-primary/10">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-lg text-primary">Outstanding Value</h3>
            <p className="text-sm text-muted-foreground">
              Highest quality food at an exceptional price
            </p>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center py-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                View Today's Menu
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/catering">
              <Button variant="outline" className="gap-2 px-6 font-medium">
                Catering Services
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
