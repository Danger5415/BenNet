import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Crosshair, View as StreetView } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { motion, AnimatePresence } from 'framer-motion';

interface Location {
  id: string;
  name: string;
  type: string;
  position: [number, number];
}

const locations: Location[] = [
  { id: '1', name: 'Main Library', type: 'library', position: [28.450362, 77.584115] },
  { id: '2', name: 'Maggi Hotspot', type: 'cafe', position: [28.450670058390724, 77.5851124293879] },
  { id: '3', name: 'Southern Stories', type: 'cafe', position: [28.450467246789973, 77.58517143798156] },
  { id: '4', name: 'Main Gate', type: 'entrance', position: [28.448542, 77.582418] },
  { id: '5', name: 'N-BLock', type: 'academic', position: [28.449008946256676, 77.58348015472107] }
];

const STREET_VIEW_LOCATION = { lat: 28.44954279827964, lng: 77.58377668948151 };
const GOOGLE_MAPS_API_KEY = 'AIzaSyAcjBM7lfQtwKJ2BuKnGa--CokjK_IlZj4';

export default function CampusMap() {
  const [showStreetView, setShowStreetView] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    loader.load().then(() => {
      if (mapRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 28.450467246789973, lng: 77.58517143798156 },
          zoom: 18,
          mapTypeId: 'satellite',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        setMap(mapInstance);

        // Create markers for each location
        const newMarkers = locations.map(location => {
          const marker = new google.maps.Marker({
            position: { lat: location.position[0], lng: location.position[1] },
            map: mapInstance,
            title: location.name,
            animation: google.maps.Animation.DROP,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: getMarkerColor(location.type),
              fillOpacity: 0.8,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            }
          });

          // Add click listener to marker
          marker.addListener('click', () => {
            setSelectedLocation(location);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 1500);
          });

          return marker;
        });

        setMarkers(newMarkers);
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (showStreetView && streetViewRef.current) {
      const panorama = new google.maps.StreetViewPanorama(streetViewRef.current, {
        position: STREET_VIEW_LOCATION,
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        motionTracking: false,
        motionTrackingControl: true,
        fullscreenControl: true
      });

      if (map) {
        map.setStreetView(panorama);
      }
    }
  }, [showStreetView, map]);

  const getMarkerColor = (type: string): string => {
    switch (type) {
      case 'library': return '#4CAF50';
      case 'academic': return '#2196F3';
      case 'cafe': return '#FF9800';
      case 'entrance': return '#9C27B0';
      default: return '#FF5722';
    }
  };

  const toggleStreetView = () => {
    setShowStreetView(!showStreetView);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Campus Map</h1>
        <motion.button
          onClick={toggleStreetView}
          className={`flex items-center px-4 py-2 rounded-lg ${
            showStreetView
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors duration-200`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <StreetView className="h-5 w-5 mr-2" />
          {showStreetView ? 'Exit Street View' : 'Enter Street View'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
            <div 
              ref={mapRef}
              className="w-full h-[500px] rounded-lg overflow-hidden"
            />
            <AnimatePresence>
              {showStreetView && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 bg-black rounded-lg overflow-hidden"
                >
                  <div ref={streetViewRef} className="w-full h-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Campus Locations</h2>
            <div className="space-y-3">
              {locations.map((location) => (
                <motion.div
                  key={location.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedLocation?.id === location.id
                      ? 'bg-blue-50 dark:bg-blue-900'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    setSelectedLocation(location);
                    map?.panTo({ lat: location.position[0], lng: location.position[1] });
                    map?.setZoom(19);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: getMarkerColor(location.type) }}
                    />
                    <div>
                      <h3 className="font-medium dark:text-white">{location.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {location.type}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
            >
              <h2 className="text-lg font-medium mb-4 dark:text-white">Location Details</h2>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold dark:text-white">{selectedLocation.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{selectedLocation.type}</p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedLocation.position[0].toFixed(6)}, {selectedLocation.position[1].toFixed(6)}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}