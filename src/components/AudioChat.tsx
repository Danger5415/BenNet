import React, { useEffect, useState } from 'react';
import { Mic, MicOff, PhoneOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioChatProps {
  sessionId: string;
  onClose: () => void;
}

export default function AudioChat({ sessionId, onClose }: AudioChatProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<{ id: string; name: string; speaking: boolean }[]>([
    { id: '1', name: 'John Doe', speaking: true },
    { id: '2', name: 'Jane Smith', speaking: false },
  ]);
  const [isMicOn, setIsMicOn] = useState(true);

  useEffect(() => {
    startLocalStream();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      setLocalStream(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl p-4">
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">
              Audio Session
            </h2>

            {/* Participants */}
            <div className="space-y-4 mb-8">
              <AnimatePresence>
                {participants.map((participant) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      participant.speaking ? 'bg-blue-600' : 'bg-gray-800'
                    } transition-colors duration-300`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-300" />
                      </div>
                      <span className="ml-3 text-white">{participant.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {participant.speaking && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex space-x-1"
                        >
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              animate={{
                                height: [4, 12, 4],
                              }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                              className="w-1 bg-white rounded"
                            />
                          ))}
                        </motion.div>
                      )}
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMic}
                className={`p-4 rounded-full ${
                  isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isMicOn ? (
                  <Mic className="h-6 w-6 text-white" />
                ) : (
                  <MicOff className="h-6 w-6 text-white" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-4 rounded-full bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}