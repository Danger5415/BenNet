import React, { useState } from 'react';
import { AlertCircle, MessageCircle, ThumbsUp } from 'lucide-react';

export default function Issues() {
  const [issues, setIssues] = useState([
    {
      id: 1,
      title: 'Broken Water Fountain',
      description: 'The water fountain on the 2nd floor of the library is not working',
      status: 'open',
      votes: 5,
      comments: 2,
      createdAt: '2024-02-20',
    },
    {
      id: 2,
      title: 'WiFi Issues in Building C',
      description: 'Intermittent WiFi connectivity in lecture halls',
      status: 'in_progress',
      votes: 8,
      comments: 4,
      createdAt: '2024-02-19',
    },
  ]);

  const [newIssue, setNewIssue] = useState({ title: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const issue = {
      id: issues.length + 1,
      ...newIssue,
      status: 'open',
      votes: 0,
      comments: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setIssues([issue, ...issues]);
    setNewIssue({ title: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Campus Issues</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-medium mb-4 dark:text-white">Report New Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              type="text"
              value={newIssue.title}
              onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={newIssue.description}
              onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit Issue
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {issue.title}
                </h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">{issue.description}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${issue.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {issue.createdAt}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <button className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                <ThumbsUp className="h-5 w-5 mr-1" />
                {issue.votes}
              </button>
              <button className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                <MessageCircle className="h-5 w-5 mr-1" />
                {issue.comments}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}