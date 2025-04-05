import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Layout } from 'react-grid-layout';

export type WidgetType = 
  | 'grades'
  | 'assignments'
  | 'studyTime'
  | 'examCountdown'
  | 'transportation'
  | 'clubSpotlight'
  | 'lostFound'
  | 'campusPolls'
  | 'successStories'
  | 'goals'
  | 'mood'
  | 'quote'
  | 'weather'
  | 'notes'
  | 'events'
  | 'cafeteria'
  | 'library';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  minW: number;
  minH: number;
  settings?: Record<string, any>;
}

interface WidgetState {
  availableWidgets: Widget[];
  activeWidgets: Widget[];
  layouts: Layout[];
  addWidget: (widget: Widget) => void;
  removeWidget: (widgetId: string) => void;
  updateLayouts: (layouts: Layout[]) => void;
  updateWidgetSettings: (widgetId: string, settings: Record<string, any>) => void;
}

const defaultWidgets: Widget[] = [
  {
    id: 'grades',
    type: 'grades',
    title: 'Grade Overview',
    description: 'View your current grades and academic progress',
    minW: 2,
    minH: 2
  },
  {
    id: 'assignments',
    type: 'assignments',
    title: 'Assignment Tracker',
    description: 'Track your upcoming assignments and deadlines',
    minW: 2,
    minH: 2
  },
  {
    id: 'studyTime',
    type: 'studyTime',
    title: 'Study Time Analysis',
    description: 'Analyze your study time allocation',
    minW: 2,
    minH: 2
  },
  {
    id: 'examCountdown',
    type: 'examCountdown',
    title: 'Exam Countdown',
    description: 'Countdown to your next exam',
    minW: 1,
    minH: 1
  },
  {
    id: 'transportation',
    type: 'transportation',
    title: 'Campus Transport',
    description: 'Real-time campus transportation information',
    minW: 2,
    minH: 1
  },
  {
    id: 'clubSpotlight',
    type: 'clubSpotlight',
    title: 'Club Spotlight',
    description: 'Featured campus clubs and societies',
    minW: 2,
    minH: 2
  },
  {
    id: 'lostFound',
    type: 'lostFound',
    title: 'Lost & Found',
    description: 'Recent lost and found items',
    minW: 2,
    minH: 2
  },
  {
    id: 'campusPolls',
    type: 'campusPolls',
    title: 'Campus Polls',
    description: 'Participate in campus polls',
    minW: 1,
    minH: 2
  },
  {
    id: 'successStories',
    type: 'successStories',
    title: 'Success Stories',
    description: 'Inspiring student success stories',
    minW: 2,
    minH: 2
  },
  {
    id: 'goals',
    type: 'goals',
    title: 'Goals Tracker',
    description: 'Track your personal and academic goals',
    minW: 2,
    minH: 2
  },
  {
    id: 'mood',
    type: 'mood',
    title: 'Mood Tracker',
    description: 'Track your daily mood and well-being',
    minW: 1,
    minH: 1
  },
  {
    id: 'quote',
    type: 'quote',
    title: 'Quote of the Day',
    description: 'Daily motivational quotes',
    minW: 2,
    minH: 1
  },
  {
    id: 'weather',
    type: 'weather',
    title: 'Campus Weather',
    description: 'Local campus weather forecast',
    minW: 1,
    minH: 1
  },
  {
    id: 'notes',
    type: 'notes',
    title: 'Quick Notes',
    description: 'Personal notes and reminders',
    minW: 2,
    minH: 2
  },
  {
    id: 'events',
    type: 'events',
    title: 'Live Events',
    description: 'Upcoming campus events',
    minW: 2,
    minH: 2
  },
  {
    id: 'cafeteria',
    type: 'cafeteria',
    title: "Today's Menu",
    description: 'Cafeteria specials and menu',
    minW: 2,
    minH: 2
  },
  {
    id: 'library',
    type: 'library',
    title: 'Library Updates',
    description: 'Book recommendations and library updates',
    minW: 2,
    minH: 2
  }
];

const defaultActiveWidgets = defaultWidgets.slice(0, 6);
const defaultLayouts = defaultActiveWidgets.map((widget, i) => ({
  i: widget.id,
  x: (i % 3) * 2,
  y: Math.floor(i / 3) * 2,
  w: widget.minW,
  h: widget.minH,
  minW: widget.minW,
  minH: widget.minH
}));

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      availableWidgets: defaultWidgets,
      activeWidgets: defaultActiveWidgets,
      layouts: defaultLayouts,

      addWidget: (widget) => set((state) => {
        if (state.activeWidgets.some(w => w.id === widget.id)) {
          return state;
        }

        const newLayout: Layout = {
          i: widget.id,
          x: 0,
          y: 0,
          w: widget.minW,
          h: widget.minH,
          minW: widget.minW,
          minH: widget.minH
        };

        return {
          activeWidgets: [...state.activeWidgets, widget],
          layouts: [...state.layouts, newLayout]
        };
      }),

      removeWidget: (widgetId) => set((state) => ({
        activeWidgets: state.activeWidgets.filter(w => w.id !== widgetId),
        layouts: state.layouts.filter(l => l.i !== widgetId)
      })),

      updateLayouts: (layouts) => set({ layouts }),

      updateWidgetSettings: (widgetId, settings) => set((state) => ({
        activeWidgets: state.activeWidgets.map(widget =>
          widget.id === widgetId
            ? { ...widget, settings: { ...widget.settings, ...settings } }
            : widget
        )
      }))
    }),
    {
      name: 'widget-storage'
    }
  )
);