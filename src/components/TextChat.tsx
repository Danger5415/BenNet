import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Video, Download, Paperclip as PaperClip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface TextChatProps {
  sessionId: string;
  onClose: () => void;
  onStartVideo: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export default function TextChat({ sessionId, onClose, onStartVideo }: TextChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channel = useRef<any>(null);

  useEffect(() => {
    setupRealtime();
    return () => {
      if (channel.current) {
        channel.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupRealtime = () => {
    channel.current = supabase.channel(`teaching-chat-${sessionId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    channel.current
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setParticipants(prev => [...new Set([...prev, ...newPresences.map(p => p.user)])]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setParticipants(prev => prev.filter(p => !leftPresences.some(lp => lp.user === p)));
      })
      .on('broadcast', { event: 'message' }, handleNewMessage)
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.current.track({ user: user?.email });
        }
      });
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      content: newMessage,
      sender: user.email,
      senderName: user.full_name || user.email,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    channel.current.send({
      type: 'broadcast',
      event: 'message',
      message
    });

    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `teaching-files/${sessionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('teaching-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('teaching-files')
        .getPublicUrl(filePath);

      const message: Message = {
        id: crypto.randomUUID(),
        content: `Shared a file: ${file.name}`,
        sender: user.email,
        senderName: user.full_name || user.email,
        timestamp: new Date().toISOString(),
        type: 'file',
        fileUrl: publicUrl,
        fileName: file.name
      };

      channel.current.send({
        type: 'broadcast',
        event: 'message',
        message
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold dark:text-white">Teaching Session Chat</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {participants.length} participants
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartVideo}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
            >
              <Video className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <X className="h-5 w-5 dark:text-white" />
            </motion.button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.sender === user?.email ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === user?.email
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.sender === user?.email ? 'You' : message.senderName}
                  </div>
                  {message.type === 'file' ? (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      <span>{message.fileName}</span>
                    </a>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={isUploading}
            >
              <PaperClip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!newMessage.trim() || isUploading}
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          {isUploading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Uploading file...
            </p>
          )}
        </form>
      </div>
    </div>
  );
}