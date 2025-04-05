import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GridLayout from 'react-grid-layout';
import { Plus, X, Settings as SettingsIcon } from 'lucide-react';
import { useWidgetStore, Widget } from '../store/widgetStore';
import { widgetComponents } from './widgets';
import 'react-grid-layout/css/styles.css';

const WidgetGrid: React.FC = () => {
  const {
    availableWidgets,
    activeWidgets,
    layouts,
    addWidget,
    removeWidget,
    updateLayouts
  } = useWidgetStore();

  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLayoutChange = (newLayout: any) => {
    updateLayouts(newLayout);
  };

  const handleAddWidget = (widget: Widget) => {
    addWidget(widget);
    setShowWidgetPicker(false);
  };

  return (
    <div className="relative min-h-screen p-6">
      {/* Widget Grid */}
      <GridLayout
        className="layout"
        layout={layouts}
        cols={12}
        rowHeight={100}
        width={1200}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-handle"
      >
        {activeWidgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.type];
          return (
            <div key={widget.id} className="relative">
              <div className="absolute top-0 right-0 z-10 flex items-center space-x-1 p-2">
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="widget-handle cursor-move absolute top-0 left-0 right-12 h-8" />
              <WidgetComponent type={widget.type} settings={widget.settings} />
            </div>
          );
        })}
      </GridLayout>

      {/* Add Widget Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowWidgetPicker(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Widget Picker Modal */}
      <AnimatePresence>
        {showWidgetPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold dark:text-white">Add Widget</h2>
                  <button
                    onClick={() => setShowWidgetPicker(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] p-2">
                  {availableWidgets
                    .filter(widget => !activeWidgets.some(w => w.id === widget.id))
                    .map((widget) => (
                      <motion.div
                        key={widget.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleAddWidget(widget)}
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">{widget.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</p>
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-24 p-4 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        <SettingsIcon className="h-6 w-6" />
      </motion.button>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold dark:text-white">Dashboard Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Add settings options here */}
                  <p className="text-gray-500 dark:text-gray-400">
                    Customize your dashboard layout and appearance.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WidgetGrid;