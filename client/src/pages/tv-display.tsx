import { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useMenuStore, useHydrated, MenuItem } from '@/lib/store';
import { useDailyMenu } from '@/hooks/use-daily-menu';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = {
  paprika: '#8B2C1D',
  paprikaLight: '#A84232',
  bisque: '#F4B966',
  sage: '#9FB88F',
  cream: '#FFF8F0',
  emerald: '#2C6E49',
  warmBrown: '#5D4037',
  gold: '#D4A574',
  darkText: '#2D2D2D',
};

export default function TVDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydrated = useHydrated();
  const items = useMenuStore(state => state.items);
  const today = new Date();
  const { data: menu, isLoading } = useDailyMenu(today, hydrated);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const getFreshItem = (item: MenuItem | null): MenuItem | null => {
    if (!item) return null;
    const freshItem = items.find(i => i.id === item.id);
    return freshItem || item;
  };

  const activeSoups = (menu?.soups ?? []).filter(Boolean).map(getFreshItem).filter((s): s is MenuItem => s !== null);
  const specials = menu?.specials;

  useEffect(() => {
    if (!hydrated || isLoading || !menu?.isPublished || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#FFF8F0');
    gradient.addColorStop(0.3, '#FFF5E6');
    gradient.addColorStop(0.7, '#FFEFD5');
    gradient.addColorStop(1, '#FFE4C4');
    ctx.fillStyle = gradient;
    ctx.fillRect(
