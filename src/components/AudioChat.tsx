import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface AudioChatProps {
  sessionId: string;
  onClose: () => void;
}

interface Participant {
  id: string;
  stream: MediaStream;
  name: string;
  speaking: boolean;
  muted: boolean;
}

export default function AudioChat({ sessionId, onClose }: AudioChatProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isMicOn, setIsMicOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceSettings, setDeviceSettings] = useState({
    audioInput: '',
    audioOutput: ''
  });
  const [availableDevices, setAvailableDevices] = useState({
    audioInput: [] as MediaDeviceInfo[],
    audioOutput: [] as MediaDeviceInfo[]
  });

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channel = useRef<any>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioAnalysers = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrames = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    initializeDevices();
    startLocalStream();
    setupSignaling();
    setupAudioContext();

    return () => {
      cleanupConnections();
      cleanupAudioAnalysers();
    };
  }, []);

  const initializeDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');

      setAvailableDevices({
        audioInput: audioInputs,
        audioOutput: audioOutputs
      });

      // Set default devices
      if (audioInputs.length) setDeviceSettings(prev => ({ ...prev, audioInput: audioInputs[0].deviceId }));
      if (audioOutputs.length) setDeviceSettings(prev => ({ ...prev, audioOutput: audioOutputs[0].deviceId }));
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  const setupAudioContext = () => {
    audioContext.current = new AudioContext();
  };

  const setupAudioAnalyser = (stream: MediaStream, participantId: string) => {
    if (!audioContext.current) return;

    const analyser = audioContext.current.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.current.createMediaStreamSource(stream);
    source.connect(analyser);

    audioAnalysers.current.set(participantId, analyser);
    detectSpeaking(analyser, participantId);
  };

  const detectSpeaking = (analyser: AnalyserNode, participantId: string) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const audioLevel = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      
      setParticipants(prev => {
        const participant = prev.get(participantId);
        if (!participant) return prev;

        const newParticipants = new Map(prev);
        newParticipants.set(participantId, {
          ...participant,
          speaking: audioLevel > 30 // Adjust threshold as needed
        });
        return newParticipants;
      });

      animationFrames.current.set(
        participantId,
        requestAnimationFrame(() => checkAudioLevel())
      );
    };

    checkAudioLevel();
  };

  const cleanupAudioAnalysers = () => {
    animationFrames.current.forEach(frameId => cancelAnimationFrame(frameId));
    animationFrames.current.clear();
    audioAnalysers.current.clear();
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceSettings.audioInput || undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setLocalStream(stream);
      setupAudioAnalyser(stream, 'local');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Failed to access microphone. Please ensure permissions are granted.');
    }
  };

  const setupSignaling = () => {
    channel.current = supabase.channel(`audio-session-${sessionId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    channel.current
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        handleNewParticipants(newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        handleParticipantLeft(leftPresences);
      })
      .on('broadcast', { event: 'signal' }, handleSignaling)
      .on('broadcast', { event: 'mute-state' }, handleMuteState)
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.current.track({ user: sessionId });
        }
      });
  };

  const handleMuteState = (payload: { from: string; isMuted: boolean }) => {
    setParticipants(prev => {
      const participant = prev.get(payload.from);
      if (!participant) return prev;

      const newParticipants = new Map(prev);
      newParticipants.set(payload.from, {
        ...participant,
        muted: payload.isMuted
      });
      return newParticipants;
    });
  };

  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'candidate',
            candidate: event.candidate,
            from: sessionId,
            to: peerId
          }
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setParticipants(prev => {
        const next = new Map(prev);
        next.set(peerId, {
          id: peerId,
          stream,
          name: `Participant ${next.size + 1}`,
          speaking: false,
          muted: false
        });
        return next;
      });

      setupAudioAnalyser(stream, peerId);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        pc.restartIce();
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  };

  const handleNewParticipants = async (newPresences: any[]) => {
    for (const presence of newPresences) {
      if (presence.user !== sessionId) {
        const pc = createPeerConnection(presence.user);
        if (localStream) {
          localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
          });
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'offer',
            sdp: pc.localDescription,
            from: sessionId,
            to: presence.user
          }
        });
      }
    }
  };

  const handleParticipantLeft = (leftPresences: any[]) => {
    for (const presence of leftPresences) {
      const pc = peerConnections.current.get(presence.user);
      if (pc) {
        pc.close();
        peerConnections.current.delete(presence.user);
      }
      setParticipants(prev => {
        const next = new Map(prev);
        next.delete(presence.user);
        return next;
      });
    }
  };

  const handleSignaling = async (payload: any) => {
    if (payload.to !== sessionId) return;

    const pc = peerConnections.current.get(payload.from) || createPeerConnection(payload.from);

    try {
      if (payload.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'answer',
            sdp: pc.localDescription,
            from: sessionId,
            to: payload.from
          }
        });
      } else if (payload.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } else if (payload.type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    } catch (error) {
      console.error('Error handling signaling:', error);
    }
  };

  const cleanupConnections = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    if (channel.current) {
      channel.current.unsubscribe();
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);

        // Notify other participants
        channel.current.send({
          type: 'broadcast',
          event: 'mute-state',
          payload: {
            isMuted: !audioTrack.enabled,
            from: sessionId
          }
        });
      }
    }
  };

  const switchDevice = async (deviceId: string, kind: 'audioinput' | 'audiooutput') => {
    try {
      if (kind === 'audiooutput') {
        const elements = document.querySelectorAll('audio') as NodeListOf<HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }>;
        await Promise.all(Array.from(elements).map(element => element.setSinkId(deviceId)));
        setDeviceSettings(prev => ({ ...prev, audioOutput: deviceId }));
        return;
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const newTrack = newStream.getAudioTracks()[0];

      if (localStream) {
        const oldTrack = localStream.getAudioTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStream.removeTrack(oldTrack);
        }
        localStream.addTrack(newTrack);

        // Update peer connections
        peerConnections.current.forEach(pc => {
          const senders = pc.getSenders();
          const sender = senders.find(s => s.track?.kind === 'audio');
          if (sender) {
            sender.replaceTrack(newTrack);
          }
        });

        setDeviceSettings(prev => ({ ...prev, audioInput: deviceId }));
      }
    } catch (error) {
      console.error('Error switching device:', error);
      setError('Failed to switch device. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl p-4">
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Audio Session
              </h2>
              {error && (
                <div className="text-red-500 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="space-y-4 mb-8">
              {/* Local participant */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-4 rounded-lg bg-gray-800 transition-colors duration-300`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <span className="ml-3 text-white">You</span>
                </div>
                <div className="flex items-center space-x-2">
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
                        className={`w-1 bg-blue-500 rounded ${!isMicOn && 'opacity-0'}`}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>

              <AnimatePresence>
                {Array.from(participants.values()).map((participant) => (
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
                      {participant.speaking && !participant.muted && (
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
                      {participant.muted ? (
                        <MicOff className="h-5 w-5 text-red-500" />
                      ) : (
                        <Mic className="h-5 w-5 text-white" />
                      )}
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
                onClick={() => setShowSettings(!showSettings)}
                className="p-4 rounded-full bg-gray-700 hover:bg-gray-600"
              >
                <Settings className="h-6 w-6 text-white" />
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

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 right-4 bg-gray-800 rounded-lg shadow-lg p-4 w-80"
            >
              <h3 className="text-white font-medium mb-4">Audio Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Microphone</label>
                  <select
                    value={deviceSettings.audioInput}
                    onChange={(e) => switchDevice(e.target.value, 'audioinput')}
                    className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    {availableDevices.audioInput.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Speaker</label>
                  <select
                    value={deviceSettings.audioOutput}
                    onChange={(e) => switchDevice(e.target.value, 'audiooutput')}
                    className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    {availableDevices.audioOutput.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}