import { format } from 'date-fns';
import { useMenuStore, type DailyMenu, type MenuItem } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ItemSelector } from './item-selector';
import { Trash2, Save, Eye, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDailyMenu, useSaveMenu, useLatestPublishedMenu } from '@/hooks/use-daily-menu';
import { useState, useEffect, useMemo } from 'react';
import { ImageCheckDialog } from './image-check-dialog';

const DEFAULT_SOUP_IDS = ['s6', 's17', 's63'];

interface MenuFormProps {
  date: Date;
}

export function MenuForm({ date }: MenuFormProps) {
  const items = useMenuStore(state => state.items);
  const { data: serverMenu, isLoading } = useDailyMenu(date);
  const { data: latestPublishedMenu } = useLatestPublishedMenu();
  const saveMenuMutation = useSaveMenu();
  
  const [localMenu, setLocalMenu] = useState<DailyMenu>({
    date: format(date, 'yyyy-MM-dd'),
    soups: Array(6).fill(null),
    specials: { panini: null, sandwich: null, salad: null, entree: null },
    isPublished: false,
  });
  const [showImageCheck, setShowImageCheck] = useState(false);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [hasPopulatedFromLatest, setHasPopulatedFromLatest] = useState(false);

  const defaultSoups = useMemo(() => 
    DEFAULT_SOUP_IDS.map(id => items.find(item => item.id === id) || null),
  [items]);

  useEffect(() => {
    if (serverMenu && items.length > 0) {
      const isEmptyMenu = serverMenu.soups.every(s => s === null) && 
        !serverMenu.specials.panini && !serverMenu.specials.sandwich && 
        !serverMenu.specials.salad && !serverMenu.specials.entree;
      
      const latestHasContent = latestPublishedMenu && (
        latestPublishedMenu.soups.some(s => s !== null) ||
        latestPublishedMenu.specials.panini ||
        latestPublishedMenu.specials.sandwich ||
        latestPublishedMenu.specials.salad ||
        latestPublishedMenu.specials.entree
      );
      
      if (isEmptyMenu && !serverMenu.isPublished && latestHasContent && !hasPopulatedFromLatest) {
        setLocalMenu({
          ...latestPublishedMenu!,
          date: format(date, 'yyyy-MM-dd'),
          isPublished: false,
        });
        setHasPopulatedFromLatest(true);
      } else if (!isEmptyMenu || serverMenu.isPublished) {
        setLocalMenu(serverMenu);
      } else if (isEmptyMenu && !latestHasContent) {
        const soupsWithDefaults: (MenuItem | null)[] = [...serverMenu.soups];
        defaultSoups.forEach((soup, idx) => {
          if (soup && idx < 3) soupsWithDefaults[idx] = soup;
        });
        setLocalMenu({ ...serverMenu, soups: soupsWithDefaults });
      }
    }
  }, [serverMenu, latestPublishedMenu, defaultSoups, date, hasPopulatedFromLatest, items.length]);

  useEffect(() => {
    setHasPopulatedFromLatest(false);
  }, [date]);

  const handleSoupChange = (index: number, item: MenuItem | null) => {
    const newSoups = [...localMenu.soups];
    newSoups[index] = item;
    setLocalMenu({ ...localMenu, soups: newSoups });
  };

  const handleClearSoup = (index: number) => {
    const newSoups = [...localMenu.soups];
    newSoups[index] = null;
    setLocalMenu({ ...localMenu, soups: newSoups });
  };

  const handleSpecialChange = (key: keyof typeof localMenu.specials, item: MenuItem | null) => {
    setLocalMenu({
      ...localMenu,
      specials: { ...localMenu.specials, [key]: item },
    });
  };

  const handleSave = async () => {
    console.log("Save button clicked");
    try {
      await saveMenuMutation.mutateAsync(localMenu);
      toast({
        title: "Menu Saved",
        description: `Menu for ${format(date, 'MMMM do, yyyy')} has been saved.`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save menu. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getItemsWithoutImages = (): MenuItem[] => {
    const allItems: (MenuItem | null)[] = [
      ...localMenu.soups,
      localMenu.specials.panini,
      localMenu.specials.sandwich,
      localMenu.specials.salad,
      localMenu.specials.entree,
    ];
    return allItems.filter((item): item is MenuItem => item !== null && !item.imageUrl);
  };

  const handlePublish = async () => {
    console.log("Publish button clicked");
    const itemsWithoutImages = getItemsWithoutImages();
    
    if (itemsWithoutImages.length > 0) {
      setPendingPublish(true);
      setShowImageCheck(true);
      return;
    }
    
    await doPublish();
  };

  const doPublish = async () => {
    try {
      await saveMenuMutation.mutateAsync({ ...localMenu, isPublished: true });
      setLocalMenu({ ...localMenu, isPublished: true });
      toast({
        title: "Menu Published!",
        description: `The menu is now live for everyone to see.`,
        className: "bg-primary text-primary-foreground"
      });
    } catch (error) {
      console.error("Publish error:", error);
      toast({
        title: "Error",
        description: "Failed to publish menu. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageCheckComplete = async (updatedItems: MenuItem[]) => {
    if (updatedItems.length > 0) {
      const updatedSoups = [...localMenu.soups];
      let updatedSpecials = { ...localMenu.specials };

      for (const item of updatedItems) {
        if (item.imageUrl) {
          const soupIdx = updatedSoups.findIndex(s => s?.id === item.id);
          if (soupIdx !== -1) {
            updatedSoups[soupIdx] = item;
          }
          if (updatedSpecials.panini?.id === item.id) updatedSpecials.panini = item;
          if (updatedSpecials.sandwich?.id === item.id) updatedSpecials.sandwich = item;
          if (updatedSpecials.salad?.id === item.id) updatedSpecials.salad = item;
          if (updatedSpecials.entree?.id === item.id) updatedSpecials.entree = item;
        }
      }

      setLocalMenu({ ...localMenu, soups: updatedSoups, specials: updatedSpecials });
    }

    setShowImageCheck(false);
    if (pendingPublish) {
      setPendingPublish(false);
      await doPublish();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary">Editing Menu For</h2>
          <p className="text-2xl font-light text-foreground">{format(date, 'EEEE, MMMM do')}</p>
          {localMenu.isPublished && (
            <span className="text-xs text-green-600 font-medium">Published</span>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none gap-2" 
            onClick={handleSave}
            disabled={saveMenuMutation.isPending}
            data-testid="button-save-draft"
          >
            {saveMenuMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </Button>
          <a href={`/print?date=${format(date, 'yyyy-MM-dd')}`} target="_blank">
            <Button variant="outline" className="flex-1 sm:flex-none gap-2" data-testid="button-preview">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </a>
          <Button 
            className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90 text-white" 
            onClick={handlePublish}
            disabled={saveMenuMutation.isPending}
            data-testid="button-publish"
          >
            {saveMenuMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="text-xl font-serif font-semibold text-primary">Daily Soups</h3>
            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-full text-secondary-foreground">6 Slots</span>
          </div>
          
          <div className="grid gap-4">
            {localMenu.soups.map((soup, index) => (
              <Card key={`soup-${index}`} className={cn(
                "transition-all duration-200", 
                soup ? "border-primary/20 bg-primary/5" : "border-dashed border-border hover:border-primary/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border text-xs font-bold text-muted-foreground shadow-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <ItemSelector
                        type="soup"
                        value={soup?.id}
                        onSelect={(item) => handleSoupChange(index, item)}
                        placeholder={`Select Soup #${index + 1}`}
                      />
                    </div>
                    {soup && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleClearSoup(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="text-xl font-serif font-semibold text-primary">Today's Specials</h3>
            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-full text-secondary-foreground">4 Categories</span>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Hot Panini</CardTitle>
                <CardDescription>Featured grilled sandwich</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemSelector
                  type="panini"
                  value={localMenu.specials.panini?.id}
                  onSelect={(item) => handleSpecialChange('panini', item)}
                  placeholder="Select Panini Special"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Signature Sandwich</CardTitle>
                <CardDescription>Cold or specialty sandwich</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemSelector
                  type="sandwich"
                  value={localMenu.specials.sandwich?.id}
                  onSelect={(item) => handleSpecialChange('sandwich', item)}
                  placeholder="Select Sandwich Special"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Featured Salad</CardTitle>
                <CardDescription>Fresh greens special</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemSelector
                  type="salad"
                  value={localMenu.specials.salad?.id}
                  onSelect={(item) => handleSpecialChange('salad', item)}
                  placeholder="Select Salad Special"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Dinner Entrée</CardTitle>
                <CardDescription>Hearty main dish</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemSelector
                  type="entree"
                  value={localMenu.specials.entree?.id}
                  onSelect={(item) => handleSpecialChange('entree', item)}
                  placeholder="Select Entrée Special"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ImageCheckDialog
        open={showImageCheck}
        onClose={() => {
          setShowImageCheck(false);
          setPendingPublish(false);
        }}
        itemsWithoutImages={getItemsWithoutImages()}
        onComplete={handleImageCheckComplete}
      />
    </div>
  );
}
