import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Video, VideoOff, Users, MessageSquare } from 'lucide-react';
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
}

export default function VideoChat({ sessionId, onClose, onOpenChat }: VideoChatProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channel = useRef<any>(null);

  useEffect(() => {
    startLocalStream();
    setupSignaling();

    return () => {
      cleanupConnections();
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Failed to access camera and microphone. Please ensure permissions are granted.');
    }
  };

  const setupSignaling = () => {
    channel.current = supabase.channel(`teaching-session-${sessionId}`, {
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
      setParticipants(prev => {
        const next = new Map(prev);
        next.set(peerId, {
          id: peerId,
          stream: event.streams[0],
          name: `Participant ${next.size + 1}`,
          isSpeaking: false
        });
        return next;
      });
    };

    peerConnections.current.set(peerId, pc);
    return pc;
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
      }
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
        }
        setIsScreenSharing(true);

        videoTrack.onended = async () => {
          await stopScreenSharing();
        };
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
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full max-w-6xl p-4">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
                className="w-full h-full object-cover"
              />
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
                    className="w-full h-full object-cover"
                    srcObject={participant.stream}
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${participant.isSpeaking ? 'bg-green-500' : 'bg-gray-500'}`} />
                    {participant.name}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Participant Count */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {participants.size + 1} participants
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex items-center justify-center space-x-4">
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
      </div>
    </div>
  );
}