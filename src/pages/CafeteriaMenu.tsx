import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Star, Edit2, Save, Clock } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  rating: number;
  totalRatings: number;
  userRating?: number;
  dayOfWeek: number; // 0-6 for Sunday-Saturday
}

const MEAL_TIMES = {
  breakfast: '7:30 AM - 9:30 AM',
  lunch: '12:00 PM - 3:00 PM',
  snacks: '5:00 PM - 6:00 PM',
  dinner: '8:00 PM - 10:00 PM',
};

export default function CafeteriaMenu() {
  const { user } = useAuthStore();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'Besan Chilla',
      description: 'With sweet and green chutney, Boiled egg, Banana, Cornflakes, Jam/Butter, Brown/White bread, Milk/Tea/Coffee',
      mealType: 'breakfast',
      rating: 4.5,
      totalRatings: 120,
      dayOfWeek: new Date().getDay(),
    },
    {
      id: '2',
      name: 'Cabbage Matar, Shahi Paneer, Chana Dal Tadka',
      description: 'With Jeera Rice, Sambhar, Roti, Onion-Cucumber Salad, Boondi Raita',
      mealType: 'lunch',
      rating: 4.2,
      totalRatings: 85,
      dayOfWeek: new Date().getDay(),
    },
    {
      id: '3',
      name: 'Bhelpuri',
      description: 'With Sweet and Green chutney, Tea/Nimbu Paani',
      mealType: 'snacks',
      rating: 4.8,
      totalRatings: 150,
      dayOfWeek: new Date().getDay(),
    },
    {
      id: '4',
      name: 'Kadai Vegetable, Kashmiri Dum Aloo, Dal Makhani',
      description: 'With Onion Rice, Roti, Fruit Custard, Onion, Hot n Sour soup',
      mealType: 'dinner',
      rating: 4.6,
      totalRatings: 200,
      dayOfWeek: new Date().getDay(),
    },
  ]);

  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const isAdmin = user?.role === 'admin';

  const handleRating = (itemId: string, rating: number) => {
    if (!user || user.role !== 'student') return;

    setMenuItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newTotalRatings = item.totalRatings + (item.userRating ? 0 : 1);
          const newRating = ((item.rating * item.totalRatings) + rating) / newTotalRatings;
          return {
            ...item,
            rating: Number(newRating.toFixed(1)),
            totalRatings: newTotalRatings,
            userRating: rating,
          };
        }
        return item;
      })
    );
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditMode(true);
  };

  const handleSave = () => {
    if (!editingItem) return;

    setMenuItems(items =>
      items.map(item =>
        item.id === editingItem.id ? editingItem : item
      )
    );
    setEditMode(false);
    setEditingItem(null);
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Cafeteria Menu</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {daysOfWeek.map((day, index) => (
              <option key={day} value={index}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      {['breakfast', 'lunch', 'snacks', 'dinner'].map((mealType) => (
        <div key={mealType} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold capitalize dark:text-white">{mealType}</h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <Clock className="h-4 w-4 mr-1" />
                {MEAL_TIMES[mealType as keyof typeof MEAL_TIMES]}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {menuItems
              .filter(item => item.mealType === mealType && item.dayOfWeek === selectedDay)
              .map(item => (
                <div key={item.id} className="border dark:border-gray-700 rounded-lg p-4">
                  {editMode && editingItem?.id === item.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <textarea
                        value={editingItem.description}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={2}
                      />
                      <button
                        onClick={handleSave}
                        className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium dark:text-white">{item.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex items-center px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-blue-500"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRating(item.id, star)}
                              disabled={!user || user.role !== 'student'}
                              className={`${
                                star <= (item.userRating || item.rating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              } ${
                                user?.role === 'student'
                                  ? 'hover:text-yellow-400'
                                  : ''
                              } transition-colors duration-150`}
                            >
                              <Star className="h-5 w-5 fill-current" />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            ({item.rating} / 5 from {item.totalRatings} ratings)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}