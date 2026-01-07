import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Lightbulb, Truck, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MenuSuggestionPopup() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    guestName: '',
    contactEmail: '',
    contactPhone: '',
    itemName: '',
    itemType: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({ guestName: '', contactEmail: '', contactPhone: '', itemName: '', itemType: '', description: '' });
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.itemName || !formData.itemType) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name, item name, and item type.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/menu-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        toast({
          title: "Thank You!",
          description: "We've received your suggestion and will review it.",
        });
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-red-50/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all border-red-200 hover:border-red-400 hover:bg-red-100/90 text-red-700"
          data-testid="button-open-suggestion"
        >
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">Request Your Favorite</span>
          <span className="sm:hidden">Suggest</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggest a Menu Item
          </DialogTitle>
          <DialogDescription>
            Share your favorite soup or dish idea with us!
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center space-y-4 py-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Thank You!</h3>
              <p className="text-sm text-muted-foreground">Our chefs will review your suggestion.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="suggestion-name" className="text-xs">Your Name *</Label>
                <Input
                  id="suggestion-name"
                  data-testid="input-suggestion-name"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="Jane Doe"
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="suggestion-type" className="text-xs">Item Type *</Label>
                <Select value={formData.itemType} onValueChange={(value) => setFormData({ ...formData, itemType: value })}>
                  <SelectTrigger id="suggestion-type" data-testid="select-suggestion-type" className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soup">Soup</SelectItem>
                    <SelectItem value="panini">Panini</SelectItem>
                    <SelectItem value="sandwich">Sandwich</SelectItem>
                    <SelectItem value="salad">Salad</SelectItem>
                    <SelectItem value="entree">Entrée</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="suggestion-item" className="text-xs">Item Name *</Label>
              <Input
                id="suggestion-item"
                data-testid="input-suggestion-item"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="Grandma's Secret Chicken Soup"
                className="h-9"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="suggestion-description" className="text-xs">Description (Optional)</Label>
              <Textarea
                id="suggestion-description"
                data-testid="input-suggestion-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ingredients, flavors, what makes it special..."
                rows={2}
                className="text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="suggestion-email" className="text-xs">Email (Optional)</Label>
                <Input
                  id="suggestion-email"
                  type="email"
                  data-testid="input-suggestion-email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="you@email.com"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="suggestion-phone" className="text-xs">Phone (Optional)</Label>
                <Input
                  id="suggestion-phone"
                  type="tel"
                  data-testid="input-suggestion-phone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="h-9"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-suggestion">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Suggestion'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DeliveryEnrollmentPopup() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    guestName: '',
    phoneNumber: '',
    optInConfirmed: false,
    preferredContactWindow: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({ guestName: '', phoneNumber: '', optInConfirmed: false, preferredContactWindow: '', notes: '' });
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and phone number.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.optInConfirmed) {
      toast({
        title: "Consent Required",
        description: "Please agree to receive text messages.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/delivery-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        toast({
          title: "You're Enrolled!",
          description: "We'll text you about advance orders and delivery.",
        });
      } else {
        throw new Error(data.error || 'Failed to enroll');
      }
    } catch (err: any) {
      toast({
        title: "Enrollment Failed",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-red-50/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all border-red-200 hover:border-red-400 hover:bg-red-100/90 text-red-700"
          data-testid="button-open-delivery"
        >
          <Truck className="h-4 w-4" />
          <span className="hidden sm:inline">Free Delivery Signup</span>
          <span className="sm:hidden">Delivery</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-green-700">
            <Truck className="h-5 w-5" />
            Free Delivery Program
          </DialogTitle>
          <DialogDescription>
            Get texts about advance orders and free delivery!
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center space-y-4 py-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-700">You're Enrolled!</h3>
              <p className="text-sm text-muted-foreground">We'll text you about advance orders and delivery.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="delivery-name" className="text-xs">Your Name *</Label>
                <Input
                  id="delivery-name"
                  data-testid="input-delivery-name"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="Jane Doe"
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delivery-phone" className="text-xs">Phone Number *</Label>
                <Input
                  id="delivery-phone"
                  type="tel"
                  data-testid="input-delivery-phone"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="h-9"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="delivery-window" className="text-xs">Preferred Contact Time (Optional)</Label>
              <Select value={formData.preferredContactWindow} onValueChange={(value) => setFormData({ ...formData, preferredContactWindow: value })}>
                <SelectTrigger id="delivery-window" data-testid="select-delivery-window" className="h-9">
                  <SelectValue placeholder="Any time is fine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                  <SelectItem value="any">Any time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="delivery-notes" className="text-xs">Notes (Optional)</Label>
              <Textarea
                id="delivery-notes"
                data-testid="input-delivery-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requests..."
                rows={2}
                className="text-sm"
              />
            </div>
            
            <div className="flex items-start space-x-3 py-1">
              <Checkbox
                id="delivery-consent"
                data-testid="checkbox-delivery-consent"
                checked={formData.optInConfirmed}
                onCheckedChange={(checked) => setFormData({ ...formData, optInConfirmed: checked === true })}
              />
              <div className="space-y-0.5 leading-none">
                <Label htmlFor="delivery-consent" className="text-xs cursor-pointer">
                  I agree to receive text messages from Soup Shoppe *
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Reply STOP to unsubscribe. Standard rates may apply.
                </p>
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting} data-testid="button-submit-enrollment">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                'Sign Up for Free Delivery'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
