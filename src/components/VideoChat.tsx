import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Video, VideoOff, Users, MessageSquare, ZoomIn, ZoomOut, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SimplePeer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';

interface VideoChatProps {
  sessionId: string;
  onClose: () => void;
  onOpenChat: () => void;
}

interface Participant {
  id: string;
  stream: MediaStream;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  peer?: SimplePeer.Instance;
}

export default function VideoChat({ sessionId, onClose, onOpenChat }: VideoChatProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'spotlight'>('grid');
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [deviceSettings, setDeviceSettings] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [availableDevices, setAvailableDevices] = useState({
    audioInput: [] as MediaDeviceInfo[],
    audioOutput: [] as MediaDeviceInfo[],
    videoInput: [] as MediaDeviceInfo[]
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peers = useRef<Map<string, SimplePeer.Instance>>(new Map());
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
      const videoInputs = devices.filter(device => device.kind === 'videoinput');

      setAvailableDevices({
        audioInput: audioInputs,
        audioOutput: audioOutputs,
        videoInput: videoInputs
      });

      if (audioInputs.length) setDeviceSettings(prev => ({ ...prev, audioInput: audioInputs[0].deviceId }));
      if (audioOutputs.length) setDeviceSettings(prev => ({ ...prev, audioOutput: audioOutputs[0].deviceId }));
      if (videoInputs.length) setDeviceSettings(prev => ({ ...prev, videoInput: videoInputs[0].deviceId }));
    } catch (error) {
      console.error('Error enumerating devices:', error);
      setError('Failed to access media devices');
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
          isSpeaking: audioLevel > 30
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
        video: { deviceId: deviceSettings.videoInput || undefined },
        audio: { 
          deviceId: deviceSettings.audioInput || undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setupAudioAnalyser(stream, 'local');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Failed to access camera and microphone. Please ensure permissions are granted.');
    }
  };

  const setupSignaling = () => {
    channel.current = supabase.channel(`video-session-${sessionId}`, {
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
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.current.track({ user: sessionId });
        }
      });
  };

  const createPeer = (initiator: boolean, targetId: string) => {
    if (!localStream) return null;

    const peer = new SimplePeer({
      initiator,
      stream: localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', data => {
      channel.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          signal: data,
          from: sessionId,
          to: targetId
        }
      });
    });

    peer.on('stream', stream => {
      setParticipants(prev => {
        const next = new Map(prev);
        next.set(targetId, {
          id: targetId,
          stream,
          name: `Participant ${next.size + 1}`,
          isSpeaking: false,
          isMuted: false,
          isVideoOff: false,
          peer
        });
        return next;
      });

      setupAudioAnalyser(stream, targetId);
    });

    peer.on('error', err => {
      console.error('Peer error:', err);
      peer.destroy();
      handlePeerDisconnect(targetId);
    });

    peer.on('close', () => {
      handlePeerDisconnect(targetId);
    });

    return peer;
  };

  const handlePeerDisconnect = (peerId: string) => {
    peers.current.delete(peerId);
    setParticipants(prev => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  };

  const handleNewParticipants = async (newPresences: any[]) => {
    for (const presence of newPresences) {
      if (presence.user !== sessionId) {
        const peer = createPeer(true, presence.user);
        if (peer) {
          peers.current.set(presence.user, peer);
        }
      }
    }
  };

  const handleParticipantLeft = (leftPresences: any[]) => {
    for (const presence of leftPresences) {
      const peer = peers.current.get(presence.user);
      if (peer) {
        peer.destroy();
        handlePeerDisconnect(presence.user);
      }
    }
  };

  const handleSignaling = async (payload: any) => {
    if (payload.to !== sessionId) return;

    let peer = peers.current.get(payload.from);

    if (!peer) {
      peer = createPeer(false, payload.from);
      if (peer) {
        peers.current.set(payload.from, peer);
      }
    }

    if (peer) {
      try {
        peer.signal(payload.signal);
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    }
  };

  const cleanupConnections = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    peers.current.forEach(peer => {
      peer.destroy();
    });
    peers.current.clear();

    if (channel.current) {
      channel.current.unsubscribe();
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);

        // Notify other participants
        channel.current.send({
          type: 'broadcast',
          event: 'video-state',
          payload: {
            isVideoOff: !videoTrack.enabled,
            from: sessionId
          }
        });
      }
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
          event: 'audio-state',
          payload: {
            isMuted: !audioTrack.enabled,
            from: sessionId
          }
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        const audioTrack = screenStream.getAudioTracks()[0];

        if (localStream) {
          // Replace video track
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (oldVideoTrack) {
            oldVideoTrack.stop();
            localStream.removeTrack(oldVideoTrack);
          }
          localStream.addTrack(videoTrack);

          // Add screen share audio if available
          if (audioTrack) {
            localStream.addTrack(audioTrack);
          }

          // Update local video
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }

          // Update all peer connections
          peers.current.forEach(peer => {
            const senders = peer._senders || [];
            const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }
            if (audioTrack) {
              const audioSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'audio');
              if (audioSender) {
                audioSender.replaceTrack(audioTrack);
              }
            }
          });

          videoTrack.onended = async () => {
            await stopScreenSharing();
          };
        }
        setIsScreenSharing(true);
      } else {
        await stopScreenSharing();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      setError('Failed to share screen. Please try again.');
    }
  };

  const stopScreenSharing = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: deviceSettings.videoInput || undefined },
        audio: { 
          deviceId: deviceSettings.audioInput || undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (localStream) {
        // Stop all existing tracks
        localStream.getTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });

        // Add new tracks
        newStream.getTracks().forEach(track => {
          localStream.addTrack(track);
        });

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Update all peer connections
        peers.current.forEach(peer => {
          const senders = peer._senders || [];
          newStream.getTracks().forEach(track => {
            const sender = senders.find((s: RTCRtpSender) => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            }
          });
        });
      }
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
      setError('Failed to stop screen sharing. Please try again.');
    }
  };

  const switchDevice = async (deviceId: string, kind: 'audioinput' | 'audiooutput' | 'videoinput') => {
    try {
      if (kind === 'audiooutput') {
        const elements = document.querySelectorAll('audio, video') as NodeListOf<HTMLMediaElement & { setSinkId: (id: string) => Promise<void> }>;
        await Promise.all(Array.from(elements).map(element => element.setSinkId(deviceId)));
        setDeviceSettings(prev => ({ ...prev, audioOutput: deviceId }));
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: kind === 'audioinput' ? { 
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : undefined,
        video: kind === 'videoinput' ? { deviceId: { exact: deviceId } } : undefined
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = kind === 'audioinput' ? newStream.getAudioTracks()[0] : newStream.getVideoTracks()[0];

      if (localStream) {
        const oldTrack = kind === 'audioinput' 
          ? localStream.getAudioTracks()[0]
          : localStream.getVideoTracks()[0];

        if (oldTrack) {
          oldTrack.stop();
          localStream.removeTrack(oldTrack);
        }
        localStream.addTrack(track);

        // Update peer connections
        peers.current.forEach(peer => {
          const senders = peer._senders || [];
          const sender = senders.find((s: RTCRtpSender) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          }
        });

        if (kind === 'videoinput' && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        setDeviceSettings(prev => ({
          ...prev,
          [kind === 'audioinput' ? 'audioInput' : 'videoInput']: deviceId
        }));
      }
    } catch (error) {
      console.error('Error switching device:', error);
      setError('Failed to switch device. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full h-full p-4 flex flex-col">
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50">
            {error}
            <button
              onClick={() => setError(null)}
              className="absolute right-2 top-2 text-white hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Video Grid */}
        <div className={`flex-1 grid gap-4 p-4 ${
          participants.size <= 1 ? 'grid-cols-1' :
          participants.size <= 4 ? 'grid-cols-2' :
          participants.size <= 9 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}>
          {/* Local Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraOn && 'hidden'}`}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isMicOn ? 'bg-green-500' : 'bg-red-500'}`} />
              You {isScreenSharing && '(Screen Sharing)'}
            </div>
          </motion.div>

          {/* Remote Videos */}
          <AnimatePresence>
            {Array.from(participants.values()).map((participant) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden"
              >
                <video
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${participant.isVideoOff && 'hidden'}`}
                  srcObject={participant.stream}
                />
                {participant.isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${participant.isMuted ? 'bg-red-500' : 'bg-green-500'}`} />
                  {participant.name}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="h-20 bg-gradient-to-t from-black to-transparent">
          <div className="container mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMic}
                className={`p-3 rounded-full ${
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
                onClick={toggleCamera}
                className={`p-3 rounded-full ${
                  isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isCameraOn ? (
                  <Camera className="h-6 w-6 text-white" />
                ) : (
                  <CameraOff className="h-6 w-6 text-white" />
                )}
              </motion.button>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleScreenShare}
                className={`p-3 rounded-full ${
                  isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isScreenSharing ? (
                  <VideoOff className="h-6 w-6 text-white" />
                ) : (
                  <Video className="h-6 w-6 text-white" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
              >
                <Settings className="h-6 w-6 text-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onOpenChat}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
              >
                <MessageSquare className="h-6 w-6 text-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  cleanupConnections();
                  onClose();
                }}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600"
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
              <h3 className="text-white font-medium mb-4">Settings</h3>
              
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
                  <label className="block text-sm text-gray-400 mb-1">Camera</label>
                  <select
                    value={deviceSettings.videoInput}
                    onChange={(e) => switchDevice(e.target.value, 'videoinput')}
                    className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    {availableDevices.videoInput.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
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