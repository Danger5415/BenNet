import React, { useState } from 'react';
import { Book, Clock, User, Users, Video, MessageSquare, Phone, Plus, AlertCircle } from 'lucide-react';
import VideoChat from '../components/VideoChat';
import TextChat from '../components/TextChat';
import AudioChat from '../components/AudioChat';
import { useAuthStore } from '../store/authStore';

interface Session {
  id: number;
  subject: string;
  description: string;
  tutor: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  enrolled: number;
  status: 'upcoming' | 'active' | 'completed';
  allowedChats: ('video' | 'audio' | 'text')[];
}

interface TutorRequest {
  id: number;
  subject: string;
  description: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  status: 'pending' | 'rejected' | 'approved';
  studentName: string;
  studentEmail: string;
}

export default function Teaching() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 1,
      subject: 'Advanced Mathematics',
      description: 'Calculus and Linear Algebra tutoring session',
      tutor: 'Dr. Smith',
      startTime: '2024-03-15T14:00',
      endTime: '2024-03-15T16:00',
      maxStudents: 5,
      enrolled: 3,
      status: 'upcoming',
      allowedChats: ['video', 'audio', 'text']
    },
    {
      id: 2,
      subject: 'Computer Science',
      description: 'Data Structures and Algorithms',
      tutor: 'Prof. Johnson',
      startTime: '2024-03-16T10:00',
      endTime: '2024-03-16T12:00',
      maxStudents: 8,
      enrolled: 6,
      status: 'upcoming',
      allowedChats: ['text']
    },
  ]);

  const [tutorRequests, setTutorRequests] = useState<TutorRequest[]>([
    {
      id: 1,
      subject: 'Python Programming',
      description: 'Basic to intermediate Python programming concepts',
      startTime: '2024-03-20T15:00',
      endTime: '2024-03-20T17:00',
      maxStudents: 10,
      status: 'pending',
      studentName: 'John Doe',
      studentEmail: 'john@example.com'
    }
  ]);

  const [newSession, setNewSession] = useState({
    subject: '',
    description: '',
    startTime: '',
    endTime: '',
    maxStudents: '',
    allowedChats: [] as ('video' | 'audio' | 'text')[]
  });

  const [newRequest, setNewRequest] = useState({
    subject: '',
    description: '',
    startTime: '',
    endTime: '',
    maxStudents: ''
  });

  const [activeSession, setActiveSession] = useState<{
    id: number;
    type: 'video' | 'audio' | 'text';
  } | null>(null);

  const [showRequestForm, setShowRequestForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const session = {
      id: sessions.length + 1,
      ...newSession,
      tutor: user?.email || 'Unknown',
      maxStudents: parseInt(newSession.maxStudents),
      enrolled: 0,
      status: 'upcoming' as const,
      allowedChats: newSession.allowedChats
    };
    setSessions([session, ...sessions]);
    setNewSession({
      subject: '',
      description: '',
      startTime: '',
      endTime: '',
      maxStudents: '',
      allowedChats: []
    });
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request = {
      id: tutorRequests.length + 1,
      ...newRequest,
      maxStudents: parseInt(newRequest.maxStudents),
      status: 'pending' as const,
      studentName: user?.full_name || 'Unknown Student',
      studentEmail: user?.email || 'unknown@email.com'
    };
    setTutorRequests([request, ...tutorRequests]);
    setNewRequest({
      subject: '',
      description: '',
      startTime: '',
      endTime: '',
      maxStudents: ''
    });
    setShowRequestForm(false);
  };

  const handleJoinSession = (sessionId: number, type: 'video' | 'audio' | 'text') => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.allowedChats.includes(type)) {
      setActiveSession({ id: sessionId, type });
    }
  };

  const handleRequestAction = (requestId: number, action: 'approve' | 'reject') => {
    setTutorRequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? { ...request, status: action === 'approve' ? 'approved' : 'rejected' }
          : request
      )
    );
  };

  const ChatComponent = {
    video: VideoChat,
    audio: AudioChat,
    text: TextChat
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Teaching & Tutoring</h1>
        {isStudent ? (
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Teaching Session
          </button>
        ) : null}
      </div>

      {/* Session Creation Form for Teachers/Admin */}
      {(isTeacher || isAdmin) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4 dark:text-white">Create Teaching Session</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                <input
                  type="text"
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Students</label>
                <input
                  type="number"
                  value={newSession.maxStudents}
                  onChange={(e) => setNewSession({ ...newSession, maxStudents: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                <input
                  type="datetime-local"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                <input
                  type="datetime-local"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={newSession.description}
                onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allowed Communication Methods
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={newSession.allowedChats.includes('video')}
                    onChange={(e) => {
                      const chats = e.target.checked
                        ? [...newSession.allowedChats, 'video']
                        : newSession.allowedChats.filter(c => c !== 'video');
                      setNewSession({ ...newSession, allowedChats: chats });
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Video Chat</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={newSession.allowedChats.includes('audio')}
                    onChange={(e) => {
                      const chats = e.target.checked
                        ? [...newSession.allowedChats, 'audio']
                        : newSession.allowedChats.filter(c => c !== 'audio');
                      setNewSession({ ...newSession, allowedChats: chats });
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Audio Chat</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={newSession.allowedChats.includes('text')}
                    onChange={(e) => {
                      const chats = e.target.checked
                        ? [...newSession.allowedChats, 'text']
                        : newSession.allowedChats.filter(c => c !== 'text');
                      setNewSession({ ...newSession, allowedChats: chats });
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Text Chat</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Session
            </button>
          </form>
        </div>
      )}

      {/* Tutor Request Form Modal for Students */}
      {showRequestForm && isStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Request Teaching Session</h2>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                <input
                  type="text"
                  value={newRequest.subject}
                  onChange={(e) => setNewRequest({ ...newRequest, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newRequest.startTime}
                    onChange={(e) => setNewRequest({ ...newRequest, startTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                  <input
                    type="datetime-local"
                    value={newRequest.endTime}
                    onChange={(e) => setNewRequest({ ...newRequest, endTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Students</label>
                <input
                  type="number"
                  value={newRequest.maxStudents}
                  onChange={(e) => setNewRequest({ ...newRequest, maxStudents: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutor Requests Section for Admin */}
      {isAdmin && tutorRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4 dark:text-white">Pending Teaching Requests</h2>
          <div className="space-y-4">
            {tutorRequests.map((request) => (
              <div
                key={request.id}
                className="border dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium dark:text-white">{request.subject}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{request.description}</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <p>Requested by: {request.studentName} ({request.studentEmail})</p>
                      <p>Time: {new Date(request.startTime).toLocaleString()} - {new Date(request.endTime).toLocaleTimeString()}</p>
                      <p>Max Students: {request.maxStudents}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRequestAction(request.id, 'approve')}
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                      disabled={request.status !== 'pending'}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestAction(request.id, 'reject')}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      disabled={request.status !== 'pending'}
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {request.status !== 'pending' && (
                  <div className={`mt-2 text-sm ${
                    request.status === 'approved' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Book className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                  {session.subject}
                </h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {session.status}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{session.description}</p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Tutor: {session.tutor}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString()}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {session.enrolled} / {session.maxStudents} students
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              {session.allowedChats.includes('video') && (
                <button
                  onClick={() => handleJoinSession(session.id, 'video')}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Video
                </button>
              )}
              {session.allowedChats.includes('audio') && (
                <button
                  onClick={() => handleJoinSession(session.id, 'audio')}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Join Audio
                </button>
              )}
              {session.allowedChats.includes('text') && (
                <button
                  onClick={() => handleJoinSession(session.id, 'text')}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Join Chat
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Components */}
      {activeSession && (
        React.createElement(ChatComponent[activeSession.type], {
          sessionId: activeSession.id.toString(),
          onClose: () => setActiveSession(null),
          onOpenChat: () => setActiveSession({ ...activeSession, type: 'text' }),
          onStartVideo: () => setActiveSession({ ...activeSession, type: 'video' }),
          onStartAudio: () => setActiveSession({ ...activeSession, type: 'audio' })
        })
      )}
    </div>
  );
}