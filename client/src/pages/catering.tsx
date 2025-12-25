import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Layout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { useState } from 'react';

export default function Catering() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventDate: '',
    guestCount: '',
    eventType: '',
    menuPreferences: '',
    additionalInfo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Catering Request Sent!",
          description: "Thank you! Our catering team will contact you within 24-48 hours.",
          className: "bg-primary text-primary-foreground"
        });
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          eventDate: '',
          guestCount: '',
          eventType: '',
          menuPreferences: '',
          additionalInfo: '',
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send request. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-primary">
            Catering Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bring the warmth and flavors of Soup Shoppe to your next event
          </p>
        </section>

        {/* Perfect for Any Occasion */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-serif font-bold text-primary">Perfect for Any Occasion</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From intimate gatherings to large corporate events, we provide delicious, freshly prepared food that brings people together
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Corporate Events */}
            <Card className="p-6 border-primary/10 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-serif font-bold text-primary mb-4">Corporate Events</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Professional catering for business meetings, conferences, and corporate lunches
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Executive luncheons</li>
                <li>• Board meetings</li>
                <li>• Team building events</li>
                <li>• Client presentations</li>
              </ul>
            </Card>

            {/* Private Parties */}
            <Card className="p-6 border-primary/10 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-serif font-bold text-primary mb-4">Private Parties</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Intimate gatherings, birthday parties, anniversaries, and family celebrations
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Birthday parties</li>
                <li>• Anniversary celebrations</li>
                <li>• Holiday gatherings</li>
                <li>• Family reunions</li>
              </ul>
            </Card>

            {/* Special Events */}
            <Card className="p-6 border-primary/10 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-serif font-bold text-primary mb-4">Special Events</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Weddings, graduations, memorial services, and community events
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Wedding receptions</li>
                <li>• Graduation parties</li>
                <li>• Community events</li>
                <li>• Memorial services</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-8 bg-muted/20 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold text-primary">How It Works</h2>
            <p className="text-muted-foreground mt-2">Simple steps to delicious catered food</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Contact Us', desc: 'Call or email to discuss your event details and menu preferences' },
              { step: '2', title: 'Customize Menu', desc: 'We\'ll help you create the perfect menu for your event and budget' },
              { step: '3', title: 'Confirm Order', desc: 'Review and confirm your order with delivery details' },
              { step: '4', title: 'Enjoy!', desc: 'Fresh, delicious food delivered and ready to serve' },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-serif font-bold text-primary">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Catering Menu */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif font-bold text-primary">Catering Menu</h2>
            <p className="text-muted-foreground">Fresh, delicious options for groups of all sizes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Soups */}
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-primary">Soups by the Gallon</h3>
              <div className="space-y-3">
                {[
                  { name: 'Chicken Noodle Soup', price: '$10.95/qt, $14.50/gal', serving: 'Qt serves 2-3, Gal serves 8-10' },
                  { name: 'Creamy Tomato Basil', price: '$8.25/qt, $11.00/gal', serving: 'Qt serves 2-3, Gal serves 8-10' },
                  { name: 'Butternut Squash', price: '$9.75/qt, $13.00/gal', serving: 'Qt serves 2-3, Gal serves 8-10' },
                  { name: 'French Onion Gratinée', price: '$10.95/qt, $14.50/gal', serving: 'Qt serves 2-3, Gal serves 8-10' },
                  { name: 'Seafood Bisque', price: '$12.95/qt, $17.25/gal', serving: 'Qt serves 2-3, Gal serves 8-10' },
                  { name: 'Garden Minestrone', price: '$8.25/qt, $11.00/gal', serving: 'Qt serves 2-3, Gal serves 8-10' },
                ].map((soup) => (
                  <Card key={soup.name} className="p-4 border-border/50">
                    <h4 className="font-semibold text-foreground">{soup.name}</h4>
                    <p className="text-sm font-medium text-primary mt-1">{soup.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">{soup.serving}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Platters & Salads */}
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-primary">Sandwich & Salad Platters</h3>
              <div className="space-y-3">
                {[
                  { name: 'Assorted Club Sandwiches', price: '$75/platter', serving: 'Serves 15-20' },
                  { name: 'Gourmet Sandwich Platter', price: '$65/platter', serving: 'Serves 12-15' },
                  { name: 'Caesar Salad', price: '$35 small, $55 large', serving: 'Sm 8-10, Lg 15-20' },
                  { name: 'Greek Salad', price: '$38 small, $58 large', serving: 'Sm 8-10, Lg 15-20' },
                  { name: 'Garden Salad', price: '$32 small, $52 large', serving: 'Sm 8-10, Lg 15-20' },
                  { name: 'Beverage Service', price: '$2.50/person', serving: 'Coffee, tea, soft drinks' },
                ].map((item) => (
                  <Card key={item.name} className="p-4 border-border/50">
                    <h4 className="font-semibold text-foreground">{item.name}</h4>
                    <p className="text-sm font-medium text-primary mt-1">{item.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.serving}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Request Quote Form */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary">Request a Quote</h2>
                <p className="text-sm text-muted-foreground mt-2">Let's discuss your catering needs</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="bg-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestCount">Number of Guests</Label>
                  <Select value={formData.guestCount} onValueChange={(value) => setFormData({ ...formData, guestCount: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select guest count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10-25">10-25 guests</SelectItem>
                      <SelectItem value="26-50">26-50 guests</SelectItem>
                      <SelectItem value="51-100">51-100 guests</SelectItem>
                      <SelectItem value="101-200">101-200 guests</SelectItem>
                      <SelectItem value="200+">200+ guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corporate Event">Corporate Event</SelectItem>
                      <SelectItem value="Private Party">Private Party</SelectItem>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menuPrefs">Menu Preferences</Label>
                  <Textarea
                    id="menuPrefs"
                    placeholder="Tell us about your menu preferences..."
                    value={formData.menuPreferences}
                    onChange={(e) => setFormData({ ...formData, menuPreferences: e.target.value })}
                    className="bg-background min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional details we should know?"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    className="bg-background min-h-[80px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  {isSubmitting ? 'Sending...' : 'Request Quote'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary">Ready to Order?</h2>
              <p className="text-sm text-muted-foreground mt-2">Contact our catering team directly</p>
            </div>

            <Card className="p-6 border-primary/10">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Phone className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-serif font-bold text-foreground">Call Us</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      <a href="tel:908-604-2000" className="hover:text-primary transition-colors font-medium">
                        908-604-2000
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Mon-Fri 8AM-6PM</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-serif font-bold text-foreground">Email Us</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      <a href="mailto:info@soupshoppe.net" className="hover:text-primary transition-colors font-medium">
                        info@soupshoppe.net
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">24-48 hour response</p>
                  </div>
                </div>

                <Card className="p-4 bg-muted/30 border-0">
                  <h4 className="font-serif font-bold text-primary text-sm">Lead Time</h4>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    <li>• 48 hours minimum</li>
                    <li>• Large events: 1 week</li>
                  </ul>
                </Card>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
