import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RealtimeProjectUpdate } from '../types.js';

interface RealtimeContextType {
  isConnected: boolean;
  updates: RealtimeProjectUpdate[];
  latestAlert: RealtimeProjectUpdate | null;
  clearLatestAlert: () => void;
  triggerLiveBroadcast: (title: string, description: string, type?: RealtimeProjectUpdate['type']) => Promise<void>;
  simulateWarehouseActivity: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [updates, setUpdates] = useState<RealtimeProjectUpdate[]>([]);
  const [latestAlert, setLatestAlert] = useState<RealtimeProjectUpdate | null>(null);

  // Load initial updates
  const loadInitialUpdates = async () => {
    try {
      const res = await fetch('/api/project-updates');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setUpdates(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load project updates:', err);
    }
  };

  useEffect(() => {
    loadInitialUpdates();

    // Connect to Server-Sent Events endpoint
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'CONNECTED') {
            setIsConnected(true);
            return;
          }
          const newUpdate: RealtimeProjectUpdate = parsed;
          setUpdates((prev) => [newUpdate, ...prev.slice(0, 49)]);
          setLatestAlert(newUpdate);

          // Auto-hide alert banner after 6 seconds
          setTimeout(() => {
            setLatestAlert((curr) => (curr?.id === newUpdate.id ? null : curr));
          }, 6000);
        } catch {
          // ignore malformed ping
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    // Polling fallback every 10 seconds to guarantee fresh updates
    const interval = setInterval(loadInitialUpdates, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const clearLatestAlert = useCallback(() => {
    setLatestAlert(null);
  }, []);

  const triggerLiveBroadcast = async (
    title: string,
    description: string,
    type: RealtimeProjectUpdate['type'] = 'PROJECT_MILESTONE'
  ) => {
    try {
      await fetch('/api/realtime/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          author: 'finishmcd@gmail.com'
        })
      });
      loadInitialUpdates();
    } catch (err) {
      console.error('Failed to broadcast:', err);
    }
  };

  const simulateWarehouseActivity = async () => {
    const simulationEvents = [
      {
        title: 'Batch B-2403 Shade Verified',
        desc: 'Lab reports delta-E < 0.6 on Single Jersey Optical White. Passed shade test.',
        type: 'QUALITY_ALERT' as const
      },
      {
        title: 'Challan DEL-260906-003 Issued',
        desc: '720 Kg 100% Cotton Fleece loaded to Delivery Van #5 for Unit-2 Cutting.',
        type: 'DELIVERY_DISPATCHED' as const
      },
      {
        title: 'New Fabric Batch Arrived at Gate',
        desc: 'MRR-260907-005 generated: 1400 Kg 2x2 Lycra Rib for H&M Polo style.',
        type: 'FABRIC_RECEIVED' as const
      },
      {
        title: 'Cutting Milestone Reached',
        desc: 'Project PO-8921 Zara reached 85% completion. 10,600 / 12,500 pcs cut.',
        type: 'PROJECT_MILESTONE' as const
      },
      {
        title: 'Task Assigned: Rack Relocation',
        desc: 'Alamgir assigned to shift 30 rolls from Staging Bay to Rack B-02.',
        type: 'TASK_UPDATED' as const
      }
    ];

    const pick = simulationEvents[Math.floor(Math.random() * simulationEvents.length)];
    await triggerLiveBroadcast(pick.title, pick.desc, pick.type);
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        updates,
        latestAlert,
        clearLatestAlert,
        triggerLiveBroadcast,
        simulateWarehouseActivity
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
