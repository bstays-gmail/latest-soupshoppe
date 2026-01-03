import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useMenuStore, useHydrated, MenuItem, DailyMenu } from '@/lib/store';
import { useDailyMenu } from '@/hooks/use-daily-menu';
import { CLOUDINARY_IMAGE_URLS } from '@/lib/cloudinary-images';
import { Loader2 } from 'lucide-react';
import { useSearch } from 'wouter';

const getImageUrl = (id: string): string | undefined => CLOUDINARY_IMAGE_URLS[id];

export default function PrintMenu() {
  const hydrated = useHydrated();
  const items = useMenuStore(state => state.items);
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const dateParam = urlParams.get('date');
  const menuDate = dateParam ? parseISO(dateParam) : new Date();
  const { data: menu, isLoading } = useDailyMenu(menuDate, hydrated);

  const getFreshItem = (item: MenuItem | null): MenuItem | null => {
    if (!item) return null;
    const freshItem = items.find(i => i.id === item.id);
    return freshItem || item;
  };

  const activeSoups = (menu?.soups ?? []).filter(Boolean).map(getFreshItem).filter((s): s is MenuItem => s !== null);
  const specials = menu?.specials;

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPreview = dateParam !== null;
  
  if (!menu?.isPublished && !isPreview) {
    return (
      <div className="print-container">
        <p>Today's menu has not been published yet.</p>
      </div>
    );
  }
  
  if (!menu || (menu.soups.every(s => s === null) && !menu.specials?.panini && !menu.specials?.sandwich && !menu.specials?.salad && !menu.specials?.entree)) {
    return (
      <div className="print-container">
        <p>No menu items have been added yet.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .print-container {
          max-width: 210mm;
          height: auto;
          margin: 0 auto;
          padding: 10px 14px;
          font-family: 'Inter', system-ui, sans-serif;
          background: white;
          color: #1a1a1a;
          box-sizing: border-box;
        }
        
        .print-header {
          text-align: center;
          border-bottom: 3px solid #8B4513;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        
        .print-logo {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 42px;
          font-weight: 800;
          color: #8B4513;
          margin: 0;
        }
        
        .print-tagline {
          font-size: 16px;
          font-weight: 600;
          color: #555;
          margin-top: 4px;
        }
        
        .print-date {
          display: inline-block;
          background: #FDF5E6;
          border: 2px solid #8B4513;
          border-radius: 20px;
          padding: 6px 18px;
          font-size: 18px;
          font-weight: 700;
          color: #8B4513;
          margin-top: 8px;
        }
        
        .print-section {
          margin-bottom: 14px;
        }
        
        .print-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 28px;
          font-weight: 800;
          color: #8B4513;
          border-bottom: 2px solid #DEB887;
          padding-bottom: 6px;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .print-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .print-item-text {
          padding: 10px 12px;
          background: #FEFEFE;
          border: 2px solid #DEB887;
          border-radius: 8px;
          text-align: center;
        }
        
        .print-item-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        
        .print-specials-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .print-special-item {
          padding: 12px 16px;
          background: #FDF5E6;
          border: 2px solid #DEB887;
          border-radius: 8px;
          text-align: center;
        }
        
        .print-special-label {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #8B4513;
          margin-bottom: 4px;
        }
        
        .print-special-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        
        .print-footer {
          margin-top: 16px;
          padding-top: 10px;
          border-top: 2px solid #DEB887;
          text-align: center;
        }
        
        .print-contact {
          display: flex;
          justify-content: center;
          gap: 30px;
          font-size: 16px;
          font-weight: 600;
          color: #555;
        }
        
        .print-contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .print-hours {
          font-size: 14px;
          font-weight: 600;
          color: #777;
          margin-top: 6px;
        }
        
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #8B4513;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .print-btn:hover {
          background: #6B3410;
        }
      `}</style>
      
      <button 
        className="print-btn no-print" 
        onClick={() => window.print()}
        data-testid="button-print"
      >
        Print / Download PDF
      </button>
      
      <div className="print-container">
        <header className="print-header">
          <h1 className="print-logo">Soup Shoppe</h1>
          <p className="print-tagline">Fresh, homemade soups & sandwiches made daily</p>
          <div className="print-date">
            {format(menuDate, 'EEEE, MMMM do, yyyy')}
          </div>
        </header>

        {activeSoups.length > 0 && (
          <section className="print-section">
            <h2 className="print-section-title">Today's Soups</h2>
            <div className="print-grid">
              {activeSoups.map((soup) => (
                <div key={soup.id} className="print-item-text">
                  <h3 className="print-item-name">{soup.name}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        {specials && (specials.panini || specials.sandwich || specials.salad || specials.entree) && (
          <section className="print-section">
            <h2 className="print-section-title">Featured Items</h2>
            <div className="print-specials-stack">
              {specials.panini && getFreshItem(specials.panini) && (
                <div className="print-special-item">
                  <div className="print-special-label">Hot Panini</div>
                  <h3 className="print-special-name">{getFreshItem(specials.panini)!.name}</h3>
                </div>
              )}
              
              {specials.sandwich && getFreshItem(specials.sandwich) && (
                <div className="print-special-item">
                  <div className="print-special-label">Signature Sandwich</div>
                  <h3 className="print-special-name">{getFreshItem(specials.sandwich)!.name}</h3>
                </div>
              )}
              
              {specials.salad && getFreshItem(specials.salad) && (
                <div className="print-special-item">
                  <div className="print-special-label">Featured Salad</div>
                  <h3 className="print-special-name">{getFreshItem(specials.salad)!.name}</h3>
                </div>
              )}
              
              {specials.entree && getFreshItem(specials.entree) && (
                <div className="print-special-item">
                  <div className="print-special-label">Dinner Entrée</div>
                  <h3 className="print-special-name">{getFreshItem(specials.entree)!.name}</h3>
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="print-footer">
          <div className="print-contact">
            <div className="print-contact-item">
              <span>📍</span>
              <span>665 Martinsville Rd, Basking Ridge, NJ</span>
            </div>
            <div className="print-contact-item">
              <span>📞</span>
              <span>908-604-2000</span>
            </div>
          </div>
          <p className="print-hours">
            Mon-Sat: 9AM-5PM | www.mysoupshop.com
          </p>
        </footer>
      </div>
    </>
  );
}
