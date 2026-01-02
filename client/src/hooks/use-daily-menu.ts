import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useMenuStore, type MenuItem, type DailyMenu } from '@/lib/store';

interface ApiDailyMenu {
  date: string;
  soups: (string | null)[];
  paniniId: string | null;
  sandwichId: string | null;
  saladId: string | null;
  entreeId: string | null;
  isPublished: boolean;
}

function convertApiMenuToLocal(apiMenu: ApiDailyMenu, items: MenuItem[]): DailyMenu {
  const findItem = (id: string | null): MenuItem | null => {
    if (!id) return null;
    return items.find(item => item.id === id) || null;
  };

  const soups = apiMenu.soups.map(id => findItem(id));
  while (soups.length < 6) {
    soups.push(null);
  }

  return {
    date: apiMenu.date,
    soups,
    specials: {
      panini: findItem(apiMenu.paniniId),
      sandwich: findItem(apiMenu.sandwichId),
      salad: findItem(apiMenu.saladId),
      entree: findItem(apiMenu.entreeId),
    },
    isPublished: apiMenu.isPublished,
  };
}

export function useDailyMenu(date: Date, hydrated: boolean = true) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const items = useMenuStore(state => state.items);

  return useQuery({
    queryKey: ['daily-menu', dateStr, items.length, hydrated],
    queryFn: async (): Promise<DailyMenu> => {
      const currentItems = useMenuStore.getState().items;
      const res = await fetch(`/api/menu/${dateStr}`);
      if (!res.ok) throw new Error('Failed to fetch menu');
      const apiMenu: ApiDailyMenu = await res.json();
      return convertApiMenuToLocal(apiMenu, currentItems);
    },
    staleTime: 30000,
    enabled: hydrated,
  });
}

export function useLatestPublishedMenu(hydrated: boolean = true) {
  const items = useMenuStore(state => state.items);

  return useQuery({
    queryKey: ['latest-published-menu', items.length, hydrated],
    queryFn: async (): Promise<DailyMenu | null> => {
      const currentItems = useMenuStore.getState().items;
      const res = await fetch('/api/menu/latest-published');
      if (!res.ok) throw new Error('Failed to fetch latest published menu');
      const apiMenu: ApiDailyMenu | null = await res.json();
      if (!apiMenu) return null;
      return convertApiMenuToLocal(apiMenu, currentItems);
    },
    staleTime: 60000,
    enabled: hydrated,
  });
}

export function useSaveMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (menu: DailyMenu) => {
      const apiMenu = {
        date: menu.date,
        soups: menu.soups.map(s => s?.id || null),
        paniniId: menu.specials.panini?.id || null,
        sandwichId: menu.specials.sandwich?.id || null,
        saladId: menu.specials.salad?.id || null,
        entreeId: menu.specials.entree?.id || null,
        isPublished: menu.isPublished,
      };
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiMenu),
      });
      if (!res.ok) throw new Error('Failed to save menu');
      const saved = await res.json();
      const currentItems = useMenuStore.getState().items;
      return convertApiMenuToLocal(saved, currentItems);
    },
    onSuccess: (data) => {
      const currentItems = useMenuStore.getState().items;
      queryClient.setQueryData(['daily-menu', data.date, currentItems.length], data);
    },
  });
}
