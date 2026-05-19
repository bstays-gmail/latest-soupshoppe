import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ImagePlus, Sparkles, Check, X, Upload, AlertCircle } from 'lucide-react';
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
  const [uploadedItems, setUploadedItems] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadItemId, setCurrentUploadItemId] = useState<string | null>(null);

  const progress = itemsWithoutImages.length > 0 
    ? (currentIndex / itemsWithoutImages.length) * 100 
    : 0;

  const handleUploadClick = (itemId: string) => {
    setCurrentUploadItemId(itemId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadItemId) return;

    setUploadingId(currentUploadItemId);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('itemId', currentUploadItemId);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      if (data.url) {
        setUploadedItems(prev => ({ ...prev, [currentUploadItemId]: data.url }));
        
        await fetch('/api/generated-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: currentUploadItemId, imageUrl: data.url }),
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploadingId(null);
      setCurrentUploadItemId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateImages = async () => {
    setIsGenerating(true);
    setCurrentIndex(0);
    setGeneratedItems([]);
    setErrors([]);

    const updatedItems: MenuItem[] = [];
    const newErrors: string[] = [];

    const itemsToGenerate = itemsWithoutImages.filter(item => !uploadedItems[item.id]);

    for (let i = 0; i < itemsToGenerate.length; i++) {
      const item = itemsToGenerate[i];
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

    itemsWithoutImages.filter(item => uploadedItems[item.id]).forEach(item => {
      updatedItems.push({ ...item, imageUrl: uploadedItems[item.id] });
    });

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
    await loadCustomItems();
    const allUpdatedItems = generatedItems.length > 0 
      ? generatedItems 
      : itemsWithoutImages.map(item => 
          uploadedItems[item.id] 
            ? { ...item, imageUrl: uploadedItems[item.id] }
            : item
        );
    onComplete(allUpdatedItems);
    onClose();
  };

  const itemsToGenerate = itemsWithoutImages.filter(item => !uploadedItems[item.id]);
  const isComplete = currentIndex === itemsToGenerate.length && !isGenerating && currentIndex > 0;

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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            data-testid="input-image-upload"
          />
          
          {!isGenerating && !isComplete && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Items without images:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {itemsWithoutImages.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-muted/50">
                    {uploadedItems[item.id] ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <ImagePlus className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                    {!uploadedItems[item.id] && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() => handleUploadClick(item.id)}
                        disabled={uploadingId === item.id}
                        data-testid={`button-upload-image-${item.id}`}
                      >
                        {uploadingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click the upload icon to use your own photo, or use AI to generate all images below.
              </p>
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
                <div className="space-y-2">
                  <p className="text-sm text-destructive">Failed to generate images for:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {itemsWithoutImages
                      .filter(item => errors.includes(item.name))
                      .map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-muted/50">
                          {uploadedItems[item.id] ? (
                            <Check className="h-4 w-4 text-green-600 shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          <span className="truncate flex-1">{item.name}</span>
                          {!uploadedItems[item.id] && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 gap-1"
                              onClick={() => handleUploadClick(item.id)}
                              disabled={uploadingId === item.id}
                              data-testid={`button-upload-failed-${item.id}`}
                            >
                              {uploadingId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-3 w-3" />
                                  <span className="text-xs">Upload</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can upload your own photos for failed items above.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {generatedItems.filter(i => i.imageUrl).length} images generated successfully.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isGenerating && !isComplete && (
            <>
              <Button variant="outline" onClick={handleSkip}>
                Skip & Publish Anyway
              </Button>
              {Object.keys(uploadedItems).length > 0 && Object.keys(uploadedItems).length === itemsWithoutImages.length && (
                <Button onClick={handleContinue} className="gap-2">
                  <Check className="h-4 w-4" />
                  Continue with Uploads
                </Button>
              )}
              {Object.keys(uploadedItems).length < itemsWithoutImages.length && (
                <Button onClick={generateImages} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Remaining with AI
                </Button>
              )}
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
