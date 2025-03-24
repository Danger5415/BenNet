import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Crosshair } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapLocation {
  id: number;
  name: string;
  description: string;
  coordinates: string;
}

export default function CampusMap() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  const locations: MapLocation[] = [
    { id: 1, name: 'Main Building', description: 'Administrative offices and main lecture halls', coordinates: 'Block-A' },
    { id: 2, name: 'Library', description: '24/7 study spaces and resources', coordinates: 'Block-B' },
    { id: 3, name: 'Student Center', description: 'Cafeteria and student activities', coordinates: 'Block-M' },
    { id: 4, name: 'Sports Complex', description: 'Gym and sports facilities', coordinates: 'Sports Complex' },
  ];

  useEffect(() => {
    if (!isTracking) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setError('');
        updateMarkerPosition(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError('Error accessing location: ' + err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking]);

  const updateMarkerPosition = (latitude: number, longitude: number) => {
    if (markerRef.current && mapRef.current) {
      // Convert GPS coordinates to relative position on the map
      // This is a simplified example - you'll need to adjust based on your actual map coordinates
      const mapRect = mapRef.current.getBoundingClientRect();
      const x = ((longitude + 180) / 360) * mapRect.width;
      const y = ((90 - latitude) / 180) * mapRect.height;
      
      markerRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  const toggleTracking = () => {
    if (!isTracking) {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }
      setIsTracking(true);
    } else {
      setIsTracking(false);
      setUserLocation(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Campus Map</h1>
        <button
          onClick={toggleTracking}
          className={`flex items-center px-4 py-2 rounded-lg ${
            isTracking
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors duration-200`}
        >
          {isTracking ? (
            <>
              <Navigation className="h-5 w-5 mr-2" />
              Stop Tracking
            </>
          ) : (
            <>
              <Crosshair className="h-5 w-5 mr-2" />
              Start Tracking
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md relative">
          <div 
            ref={mapRef}
            className="relative w-full overflow-hidden rounded-lg"
          >
            <img
              src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
              alt="Bennett University Campus Map"
              className="w-full h-auto rounded-lg"
            />
            {isTracking && (
              <div
                ref={markerRef}
                className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg pulse-animation"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>
          {userLocation && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Current Location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <MapPin className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {location.name}
                  </h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    {location.description}
                  </p>
                  <p className="mt-1 text-sm text-blue-500 dark:text-blue-400">
                    Location: {location.coordinates}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}