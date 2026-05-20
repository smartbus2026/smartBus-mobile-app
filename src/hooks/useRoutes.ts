import { useState, useEffect } from 'react';
import Api from '../services/api';

export interface BusRoute {
  id: string;
  code: string;
  name: string;
  distance: string;
  duration: string;
  activeBuses: number;
  stops: string[];
  driver?: string;
  time?: string;
  bus?: string;
}

export const useRoutes = () => {
  const [routes, setRoutes]       = useState<BusRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoutes = async () => {
    try {
      const res  = await Api.get('/routes');
      const data = res.data?.data || res.data || [];
      const mapped = data.map((r: any, index: number) => ({
        id:          r._id,
        code:        `R-${String(index + 1).padStart(3, '0')}`,
        name:        r.name,
        distance:    r.distance || '—',
        duration:    r.duration || '—',
        activeBuses: 0,
        stops:       r.stops ? r.stops.map((s: any) => s.name || s) : [],
        driver:      r.driver || 'Pending',
        time:        r.time   || 'TBA',
        bus:         r.bus    || r.code || 'BUS-01',
      }));
      setRoutes(mapped);
      return mapped;
    } catch (error) {
      console.error('Failed to fetch routes', error);
      return [];
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  return { routes, isLoading, refresh: fetchRoutes };
};