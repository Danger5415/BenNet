import React, { useState } from 'react';
import { Book, Clock, User, Users } from 'lucide-react';

export default function Teaching() {
  const [sessions, setSessions] = useState([
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
    },
  ]);

  const [newSession, setNewSession] = useState({
    subject: '',
    description: '',
    startTime: '',
    endTime: '',
    maxStudents: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const session = {
      id: sessions.length + 1,
      ...newSession,
      tutor: 'You',
      maxStudents: parseInt(newSession.maxStudents),
      enrolled: 0,
      status: 'upcoming',
    };
    setSessions([session, ...sessions]);
    setNewSession({ subject: '', description: '', startTime: '', endTime: '', maxStudents: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Teaching & Tutoring</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-medium mb-4 dark:text-white">Create Tutoring Session</h2>
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
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Session
          </button>
        </form>
      </div>

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
            <button
              className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Join Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}