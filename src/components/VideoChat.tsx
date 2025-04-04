import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Video, VideoOff, Users, MessageSquare, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

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
      const videoInputs = devices.filter(device => device.kind === 'videoinput');

      setAvailableDevices({
        audioInput: audioInputs,
        audioOutput: audioOutputs,
        videoInput: videoInputs
      });

      // Set default devices
      if (audioInputs.length) setDeviceSettings(prev => ({ ...prev, audioInput: audioInputs[0].deviceId }));
      if (audioOutputs.length) setDeviceSettings(prev => ({ ...prev, audioOutput: audioOutputs[0].deviceId }));
      if (videoInputs.length) setDeviceSettings(prev => ({ ...prev, videoInput: videoInputs[0].deviceId }));
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
          isSpeaking: audioLevel > 30 // Adjust threshold as needed
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
          noiseSuppression: true
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
          isSpeaking: false,
          isMuted: false,
          isVideoOff: false
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
          video: true
        });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        if (localStream && videoTrack) {
          const sender = localStream.getVideoTracks()[0];
          if (sender) {
            sender.stop();
            localStream.removeTrack(sender);
          }
          localStream.addTrack(videoTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }

          // Update all peer connections with the new track
          peerConnections.current.forEach(pc => {
            const senders = pc.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
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
        video: { deviceId: deviceSettings.videoInput || undefined }
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      if (localStream && newVideoTrack) {
        const sender = localStream.getVideoTracks()[0];
        if (sender) {
          sender.stop();
          localStream.removeTrack(sender);
        }
        localStream.addTrack(newVideoTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Update all peer connections with the new track
        peerConnections.current.forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack);
          }
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
        audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : undefined,
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
        peerConnections.current.forEach(pc => {
          const senders = pc.getSenders();
          const sender = senders.find(s => s.track?.kind === track.kind);
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

  const getParticipantStyle = (participant: Participant) => {
    return {
      border: participant.isSpeaking ? '2px solid #22c55e' : 'none',
      transform: `scale(${participant.isSpeaking ? 1.02 : 1})`,
      transition: 'all 0.3s ease-in-out'
    };
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
          'grid-cols-3'
        }`}>
          {/* Local Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden"
            style={getParticipantStyle({ id: 'local', stream: localStream!, name: 'You', isSpeaking: false, isMuted: !isMicOn, isVideoOff: !isCameraOn })}
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
                style={getParticipantStyle(participant)}
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
                onClick={onClose}
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