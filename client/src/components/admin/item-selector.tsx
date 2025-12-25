import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMenuStore, type MenuItem, type ItemType } from '@/lib/store';
import { Badge } from '@/components/ui/badge';

interface ItemSelectorProps {
  type: ItemType;
  value?: string | null;
  onSelect: (item: MenuItem | null) => void;
  label?: string;
  placeholder?: string;
}

export function ItemSelector({ type, value, onSelect, label, placeholder = "Select item..." }: ItemSelectorProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemTags, setNewItemTags] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const items = useMenuStore(state => state.items);
  const addItem = useMenuStore(state => state.addItem);
  
  const filteredItems = useMemo(() => 
    items.filter(item => item.type === type), 
  [items, type]);

  const selectedItem = useMemo(() => 
    items.find(item => item.id === value), 
  [items, value]);

  const handleCreateItem = async () => {
    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      type,
      name: newItemName,
      description: newItemDesc,
      tags: newItemTags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl: newItemImage || undefined,
    };
    
    setIsSaving(true);
    setSaveError('');
    
    try {
      const res = await fetch('/api/custom-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to save item. Please try again.');
      }
      
      addItem(newItem);
      onSelect(newItem);
      setDialogOpen(false);
      setOpen(false);
      
      // Reset form
      setNewItemName('');
      setNewItemDesc('');
      setNewItemTags('');
      setNewItemImage('');
    } catch (error) {
      console.error('Failed to save custom item to server:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-3 px-4 bg-background hover:bg-accent/5 hover:text-accent-foreground border-input"
          >
            {selectedItem ? (
              <div className="flex flex-col items-start gap-1 text-left w-full overflow-hidden">
                <span className="font-medium truncate w-full">{selectedItem.name}</span>
                <span className="text-xs text-muted-foreground truncate w-full font-normal opacity-80">{selectedItem.description}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${type}s...`} />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No {type} found.
                  <Button 
                    variant="link" 
                    className="h-auto p-0 ml-1 text-primary"
                    onClick={() => setDialogOpen(true)}
                  >
                    Create new?
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading="Database Items">
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id + item.name} // Hack to search by ID or name
                    onSelect={() => {
                      onSelect(item.id === value ? null : item);
                      setOpen(false);
                    }}
                    className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{item.name}</span>
                      {value === item.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">{item.description}</span>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] bg-secondary px-1.5 rounded-sm text-secondary-foreground">{tag}</span>
                        ))}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => setDialogOpen(true)} className="text-primary font-medium cursor-pointer bg-primary/5 hover:bg-primary/10 mt-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New {type === 'entree' ? 'Entrée' : type.charAt(0).toUpperCase() + type.slice(1)}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {type === 'entree' ? 'Entrée' : type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
            <DialogDescription>
              This item will be saved to your database permanently.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Grandma's Chicken Soup"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                placeholder="Describe ingredients, taste, texture..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={newItemTags}
                onChange={(e) => setNewItemTags(e.target.value)}
                placeholder="e.g. Vegan, GF, Spicy"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={newItemImage}
                onChange={(e) => setNewItemImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          {saveError && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {saveError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleCreateItem} disabled={!newItemName || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save to Database'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
