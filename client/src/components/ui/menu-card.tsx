import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/lib/store';
import { Leaf, Flame, Star, WheatOff, Award, Utensils } from 'lucide-react';
import { getImageForItem } from '@/lib/image-mapper';

interface MenuCardProps {
  item: MenuItem;
  highlight?: boolean;
}

export function MenuCard({ item, highlight }: MenuCardProps) {
  const imageUrl = item.imageUrl || getImageForItem(item.name, item.type);
  // Helper to get icon for tag
  const getTagIcon = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('vegan') || t.includes('vegetarian')) return <Leaf className="h-3 w-3" />;
    if (t.includes('spicy') || t.includes('hot')) return <Flame className="h-3 w-3" />;
    if (t.includes('signature') || t.includes('premium')) return <Award className="h-3 w-3" />;
    if (t.includes('gf') || t.includes('gluten')) return <WheatOff className="h-3 w-3" />;
    return <Utensils className="h-3 w-3" />;
  };

  const getTagColor = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('vegan') || t.includes('vegetarian')) return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
    if (t.includes('spicy')) return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
    if (t.includes('gf')) return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100";
    if (t.includes('premium')) return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100";
    return "bg-secondary text-secondary-foreground border-secondary-foreground/10 hover:bg-secondary";
  };

  return (
    <Card className={cn(
      "h-full overflow-hidden transition-all duration-300 hover:shadow-md border-muted group bg-card",
      highlight && "ring-1 ring-primary/20 shadow-sm"
    )}>
      <CardHeader className="pb-3 relative">
        {imageUrl && (
          <div className="w-full h-40 mb-3 overflow-hidden rounded-md">
            <img 
              src={imageUrl} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="font-serif text-xl leading-tight text-primary group-hover:text-primary/80 transition-colors">
            {item.name}
          </CardTitle>
          {item.price && (
            <span className="font-mono text-sm font-bold text-foreground/80 bg-muted px-2 py-1 rounded-md">
              {item.price}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed min-h-[40px]">
          {item.description}
        </p>
        
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {item.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className={cn("text-[10px] px-2 py-0.5 gap-1 font-medium border", getTagColor(tag))}
              >
                {getTagIcon(tag)}
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
