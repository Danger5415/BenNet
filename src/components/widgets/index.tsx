import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Calendar,
  Clock,
  Cloud,
  Coffee,
  GraduationCap,
  Library,
  MapPin,
  MessageSquare,
  Search,
  Smile,
  Star,
  Target,
  Users
} from 'lucide-react';
import type { WidgetType } from '../../store/widgetStore';

interface WidgetProps {
  type: WidgetType;
  settings?: Record<string, any>;
}

const WidgetWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
  >
    {children}
  </motion.div>
);

export const GradesWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Grades</h3>
      </div>
      {/* Add grades content */}
    </div>
  </WidgetWrapper>
);

export const AssignmentsWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-green-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Assignments</h3>
      </div>
      {/* Add assignments content */}
    </div>
  </WidgetWrapper>
);

export const StudyTimeWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 text-purple-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Study Time</h3>
      </div>
      {/* Add study time content */}
    </div>
  </WidgetWrapper>
);

export const ExamCountdownWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 text-red-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Exam Countdown</h3>
      </div>
      {/* Add exam countdown content */}
    </div>
  </WidgetWrapper>
);

export const TransportationWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Campus Transport</h3>
      </div>
      {/* Add transportation content */}
    </div>
  </WidgetWrapper>
);

export const ClubSpotlightWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-indigo-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Club Spotlight</h3>
      </div>
      {/* Add club spotlight content */}
    </div>
  </WidgetWrapper>
);

export const LostFoundWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Search className="h-5 w-5 text-orange-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Lost & Found</h3>
      </div>
      {/* Add lost & found content */}
    </div>
  </WidgetWrapper>
);

export const CampusPollsWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 text-pink-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Campus Polls</h3>
      </div>
      {/* Add campus polls content */}
    </div>
  </WidgetWrapper>
);

export const SuccessStoriesWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Star className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Success Stories</h3>
      </div>
      {/* Add success stories content */}
    </div>
  </WidgetWrapper>
);

export const GoalsWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Target className="h-5 w-5 text-green-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Goals</h3>
      </div>
      {/* Add goals content */}
    </div>
  </WidgetWrapper>
);

export const MoodWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Smile className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Mood</h3>
      </div>
      {/* Add mood content */}
    </div>
  </WidgetWrapper>
);

export const QuoteWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 text-purple-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Quote</h3>
      </div>
      {/* Add quote content */}
    </div>
  </WidgetWrapper>
);

export const WeatherWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Cloud className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Weather</h3>
      </div>
      {/* Add weather content */}
    </div>
  </WidgetWrapper>
);

export const NotesWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Notes</h3>
      </div>
      {/* Add notes content */}
    </div>
  </WidgetWrapper>
);

export const EventsWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-red-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Events</h3>
      </div>
      {/* Add events content */}
    </div>
  </WidgetWrapper>
);

export const CafeteriaWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Coffee className="h-5 w-5 text-brown-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Cafeteria</h3>
      </div>
      {/* Add cafeteria content */}
    </div>
  </WidgetWrapper>
);

export const LibraryWidget: React.FC<WidgetProps> = () => (
  <WidgetWrapper>
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Library className="h-5 w-5 text-indigo-500 mr-2" />
        <h3 className="font-medium text-gray-900 dark:text-white">Library</h3>
      </div>
      {/* Add library content */}
    </div>
  </WidgetWrapper>
);

export const widgetComponents: Record<WidgetType, React.FC<WidgetProps>> = {
  grades: GradesWidget,
  assignments: AssignmentsWidget,
  studyTime: StudyTimeWidget,
  examCountdown: ExamCountdownWidget,
  transportation: TransportationWidget,
  clubSpotlight: ClubSpotlightWidget,
  lostFound: LostFoundWidget,
  campusPolls: CampusPollsWidget,
  successStories: SuccessStoriesWidget,
  goals: GoalsWidget,
  mood: MoodWidget,
  quote: QuoteWidget,
  weather: WeatherWidget,
  notes: NotesWidget,
  events: EventsWidget,
  cafeteria: CafeteriaWidget,
  library: LibraryWidget
};