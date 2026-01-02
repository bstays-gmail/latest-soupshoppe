import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ImagePlus, Sparkles, Check, X } from 'lucide-react';
import { useMenuStore, type MenuItem } from '@/lib/store';

interface ImageCheckDialogProps {
  open: boolean;
  onClose: () => void;
  itemsWithoutImages: MenuItem[];
  onComplete: (updatedItems: MenuItem[]) => void;
}

export function ImageCheckDialog({ open, onClose, itemsWithoutImages, onComplete }: ImageCheckDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generatedItems, setGeneratedItems] = useState<MenuItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const progress = itemsWithoutImages.length > 0 
    ? (currentIndex / itemsWithoutImages.length) * 100 
    : 0;

  const generateImages = async () => {
    setIsGenerating(true);
    setCurrentIndex(0);
    setGeneratedItems([]);
    setErrors([]);

    const updatedItems: MenuItem[] = [];
    const newErrors: string[] = [];

    for (let i = 0; i < itemsWithoutImages.length; i++) {
      const item = itemsWithoutImages[i];
      setCurrentIndex(i + 1);

      try {
        const prompt = `Professional food photography of ${item.name}. Restaurant menu style, appetizing presentation, soft natural lighting, clean white plate, shallow depth of field, high-end restaurant quality. ${item.description || ''}`.trim();

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, size: '1024x1024', itemId: item.id }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to generate image');
        }

        const data = await response.json();
        
        if (!data.url) {
          throw new Error('No image data received');
        }

        const imageUrl = data.url;

        await fetch('/api/generated-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            itemId: item.id, 
            imageUrl,
            itemData: {
              name: item.name,
              description: item.description,
              type: item.type,
              tags: item.tags,
            }
          }),
          credentials: 'include',
        });

        updatedItems.push({ ...item, imageUrl });
      } catch (error) {
        console.error(`Failed to generate image for ${item.name}:`, error);
        newErrors.push(item.name);
        updatedItems.push(item);
      }
    }

    setGeneratedItems(updatedItems);
    setErrors(newErrors);
    setIsGenerating(false);
  };

  const loadCustomItems = useMenuStore(state => state.loadCustomItems);

  const handleSkip = () => {
    onComplete([]);
    onClose();
  };

  const handleContinue = async () => {
    // Reload custom items from server to get updated imageUrls
    await loadCustomItems();
    onComplete(generatedItems);
    onClose();
  };

  const isComplete = currentIndex === itemsWithoutImages.length && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isGenerating && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Missing Images
          </DialogTitle>
          <DialogDescription>
            {itemsWithoutImages.length} menu item{itemsWithoutImages.length !== 1 ? 's' : ''} {itemsWithoutImages.length !== 1 ? 'are' : 'is'} missing photos. 
            Would you like AI to generate professional food images for them?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!isGenerating && !isComplete && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Items without images:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {itemsWithoutImages.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-muted/50">
                    <ImagePlus className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto capitalize">{item.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">
                  Generating image {currentIndex} of {itemsWithoutImages.length}...
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Creating: {itemsWithoutImages[currentIndex - 1]?.name}
              </p>
            </div>
          )}

          {isComplete && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">Image generation complete!</span>
              </div>
              {errors.length > 0 && (
                <div className="text-sm text-destructive">
                  <p>Failed to generate images for:</p>
                  <ul className="list-disc ml-4">
                    {errors.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {generatedItems.filter(i => i.imageUrl).length} images generated successfully.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!isGenerating && !isComplete && (
            <>
              <Button variant="outline" onClick={handleSkip}>
                Skip & Publish Anyway
              </Button>
              <Button onClick={generateImages} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Images
              </Button>
            </>
          )}
          {isComplete && (
            <Button onClick={handleContinue} className="gap-2">
              <Check className="h-4 w-4" />
              Continue Publishing
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
