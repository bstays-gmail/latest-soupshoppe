import { useEffect } from 'react';
import { format } from 'date-fns';
import { useMenuStore, useHydrated, MenuItem, DailyMenu } from '@/lib/store';
import { useDailyMenu } from '@/hooks/use-daily-menu';
import { CLOUDINARY_IMAGE_URLS } from '@/lib/cloudinary-images';
import { Loader2 } from 'lucide-react';

const getImageUrl = (id: string): string | undefined => CLOUDINARY_IMAGE_URLS[id];

export default function PrintMenu() {
  const hydrated = useHydrated();
  const items = useMenuStore(state => state.items);
  const today = new Date();
  const { data: menu, isLoading } = useDailyMenu(today, hydrated);

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

  if (!menu?.isPublished) {
    return (
      <div className="print-container">
        <p>Today's menu has not been published yet.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5in;
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
          min-height: 297mm;
          margin: 0 auto;
          padding: 24px;
          font-family: 'Inter', system-ui, sans-serif;
          background: white;
          color: #1a1a1a;
        }
        
        .print-header {
          text-align: center;
          border-bottom: 4px solid #8B4513;
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        
        .print-logo {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 48px;
          font-weight: 800;
          color: #8B4513;
          margin: 0;
        }
        
        .print-tagline {
          font-size: 18px;
          font-weight: 600;
          color: #555;
          margin-top: 8px;
        }
        
        .print-date {
          display: inline-block;
          background: #FDF5E6;
          border: 2px solid #8B4513;
          border-radius: 24px;
          padding: 10px 24px;
          font-size: 20px;
          font-weight: 700;
          color: #8B4513;
          margin-top: 16px;
        }
        
        .print-section {
          margin-bottom: 32px;
        }
        
        .print-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32px;
          font-weight: 800;
          color: #8B4513;
          border-bottom: 3px solid #DEB887;
          padding-bottom: 10px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .print-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .print-item-text {
          padding: 16px 20px;
          background: #FEFEFE;
          border: 2px solid #DEB887;
          border-radius: 10px;
          text-align: center;
        }
        
        .print-item-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        
        .print-specials-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .print-special-item {
          padding: 20px;
          background: #FDF5E6;
          border: 2px solid #DEB887;
          border-radius: 10px;
          text-align: center;
        }
        
        .print-special-label {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #8B4513;
          margin-bottom: 10px;
        }
        
        .print-special-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        
        .print-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 3px solid #DEB887;
          text-align: center;
        }
        
        .print-contact {
          display: flex;
          justify-content: center;
          gap: 40px;
          font-size: 18px;
          font-weight: 600;
          color: #555;
        }
        
        .print-contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .print-hours {
          font-size: 16px;
          font-weight: 600;
          color: #777;
          margin-top: 16px;
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
            {format(today, 'EEEE, MMMM do, yyyy')}
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
            <div className="print-specials-grid">
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
