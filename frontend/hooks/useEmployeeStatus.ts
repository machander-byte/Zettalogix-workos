'use client';

import { useEffect, useState } from 'react';
import { statusService } from '@/services/statusService';
import { IEmployeeStatusRecord } from '@/types';

export const useEmployeeStatus = () => {
  const [status, setStatus] = useState<IEmployeeStatusRecord | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await statusService.me();
        if (mounted) setStatus(data);
      } catch (error) {
        console.error('Failed to fetch employee status', error);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  return status;
};
