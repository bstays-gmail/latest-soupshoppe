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
    ctx.fillRect(0, 0, width, height);

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, color: string) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const drawShadowRect = (x: number, y: number, w: number, h: number, r: number, color: string) => {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      drawRoundedRect(x, y, w, h, r, color);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    };

    const wrapText = (text: string, maxWidth: number, fontSize: number, fontFamily: string): string[] => {
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines.slice(0, 2);
    };

    const drawCenteredText = (text: string, x: number, y: number, fontSize: number, fontFamily: string, color: string) => {
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    };

    const drawWrappedText = (text: string, x: number, startY: number, maxWidth: number, fontSize: number, lineHeight: number, fontFamily: string, color: string) => {
      const lines = wrapText(text, maxWidth, fontSize, fontFamily);
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const totalHeight = (lines.length - 1) * lineHeight;
      const adjustedStartY = startY - totalHeight / 2;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, x, adjustedStartY + index * lineHeight);
      });
    };

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    drawShadowRect(40, 50, width - 80, 160, 25, COLORS.paprika);
    drawCenteredText("Today's Specials", width / 2, 130, 90, 'Georgia, serif', '#FFFFFF');

    let yPos = 260;
    const soupBoxHeight = 520;

    drawShadowRect(40, yPos, width - 80, soupBoxHeight, 25, '#FFFFFF');
    
    drawCenteredText('Soups', width / 2, yPos + 60, 72, 'Georgia, serif', COLORS.paprika);
    
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(width / 2 - 120, yPos + 100, 240, 5);

    const soupStartY = yPos + 170;
    const soupSpacing = 55;
    
    for (let i = 0; i < activeSoups.length && i < 6; i++) {
      const soup = activeSoups[i];
      const yBase = soupStartY + (i * soupSpacing);
      
      let displayText = soup.name.replace(/ GF/gi, '').replace(/GF/gi, '').trim();
      const hasGF = soup.name.toLowerCase().includes('gf') || (soup.tags && soup.tags.includes('gf'));
      
      ctx.font = `bold 46px Arial, sans-serif`;
      ctx.fillStyle = COLORS.darkText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayText, width / 2, yBase);
      
      if (hasGF) {
        ctx.fillStyle = COLORS.emerald;
        ctx.font = 'bold 28px Arial, sans-serif';
        const textWidth = ctx.measureText(displayText).width;
        ctx.fillText('GF', width / 2 + textWidth / 2 + 15, yBase);
      }
    }

    yPos = 820;
    const cardWidth = width - 80;
    const cardHeight = 240;
    const cardGap = 25;
    const cardContentMaxWidth = cardWidth - 100;
    const titleFontSize = 42;
    const itemFontSize = 56;
    const lineHeight = 65;

    drawShadowRect(40, yPos, cardWidth, cardHeight, 25, COLORS.paprikaLight);
    drawCenteredText('Hot Panini', width / 2, yPos + 50, titleFontSize, 'Georgia, serif', '#FFFFFF');
    const panini = specials?.panini ? getFreshItem(specials.panini) : null;
    if (panini) {
      drawWrappedText(panini.name, width / 2, yPos + 155, cardContentMaxWidth, itemFontSize, lineHeight, 'Arial, sans-serif', COLORS.bisque);
    }

    yPos += cardHeight + cardGap;

    drawShadowRect(40, yPos, cardWidth, cardHeight, 25, COLORS.warmBrown);
    drawCenteredText('Cold Sandwich', width / 2, yPos + 50, titleFontSize, 'Georgia, serif', '#FFFFFF');
    const sandwich = specials?.sandwich ? getFreshItem(specials.sandwich) : null;
    if (sandwich) {
      drawWrappedText(sandwich.name, width / 2, yPos + 155, cardContentMaxWidth, itemFontSize, lineHeight, 'Arial, sans-serif', COLORS.bisque);
    }

    yPos += cardHeight + cardGap;

    drawShadowRect(40, yPos, cardWidth, cardHeight, 25, COLORS.sage);
    drawCenteredText('Featured Salad', width / 2, yPos + 50, titleFontSize, 'Georgia, serif', '#FFFFFF');
    const salad = specials?.salad ? getFreshItem(specials.salad) : null;
    if (salad) {
      drawWrappedText(salad.name, width / 2, yPos + 155, cardContentMaxWidth, itemFontSize, lineHeight, 'Arial, sans-serif', COLORS.darkText);
    }

    yPos += cardHeight + cardGap;

    drawShadowRect(40, yPos, cardWidth, cardHeight, 25, COLORS.bisque);
    drawCenteredText('Dinner Entrée', width / 2, yPos + 50, titleFontSize, 'Georgia, serif', COLORS.paprika);
    const entree = specials?.entree ? getFreshItem(specials.entree) : null;
    if (entree) {
      drawWrappedText(entree.name, width / 2, yPos + 155, cardContentMaxWidth, itemFontSize, lineHeight, 'Arial, sans-serif', COLORS.darkText);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setImageUrl(dataUrl);

  }, [hydrated, isLoading, menu, items, today]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `soup-shoppe-tv-menu-${format(today, 'yyyy-MM-dd')}.jpg`;
    link.href = imageUrl;
    link.click();
  };

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!menu?.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl">Today's menu has not been published yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-amber-900">TV Display Menu</h1>
          <Button 
            onClick={handleDownload}
            disabled={!imageUrl}
            className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-8 py-4 text-lg rounded-xl shadow-lg"
            data-testid="button-download-tv"
          >
            <Download className="w-6 h-6 mr-2" />
            Download for TV
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <p className="text-amber-700 mb-4 text-center font-medium">
            1080×1920 HD Portrait Display
          </p>
          <div className="flex justify-center">
            <canvas 
              ref={canvasRef} 
              className="rounded-lg shadow-lg"
              style={{ width: '360px', height: '640px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
