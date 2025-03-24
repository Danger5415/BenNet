import React, { useState } from 'react';
import { AlertCircle, MessageCircle, ArrowBigUp, ArrowBigDown, Send, Share2, Flag, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Comment {
  id: number;
  content: string;
  author: string;
  isAdmin: boolean;
  createdAt: string;
  votes: number;
  userVote: 'up' | 'down' | null;
}

interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  comments: Comment[];
  createdAt: string;
  author: string;
  isAdmin: boolean;
}

export default function Issues() {
  const { user } = useAuthStore();
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 1,
      title: 'Broken Water Fountain',
      description: 'The water fountain on the 2nd floor of the library is not working',
      status: 'open',
      upvotes: 5,
      downvotes: 1,
      userVote: null,
      comments: [
        {
          id: 1,
          content: 'Maintenance team has been notified.',
          author: 'admin@campus.edu',
          isAdmin: true,
          createdAt: '2024-02-20 10:30',
          votes: 3,
          userVote: null
        }
      ],
      createdAt: '2024-02-20',
      author: 'student@campus.edu',
      isAdmin: false
    },
    {
      id: 2,
      title: 'WiFi Issues in Building C',
      description: 'Intermittent WiFi connectivity in lecture halls',
      status: 'in_progress',
      upvotes: 8,
      downvotes: 2,
      userVote: null,
      comments: [
        {
          id: 2,
          content: 'IT team is working on resolving this issue.',
          author: 'admin@campus.edu',
          isAdmin: true,
          createdAt: '2024-02-19 15:45',
          votes: 4,
          userVote: null
        }
      ],
      createdAt: '2024-02-19',
      author: 'student@campus.edu',
      isAdmin: false
    }
  ]);

  const [newIssue, setNewIssue] = useState({ title: '', description: '' });
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const issue: Issue = {
      id: issues.length + 1,
      ...newIssue,
      status: 'open',
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      comments: [],
      createdAt: new Date().toISOString().split('T')[0],
      author: user?.email || '',
      isAdmin: user?.role === 'admin'
    };
    setIssues([issue, ...issues]);
    setNewIssue({ title: '', description: '' });
  };

  const handleVote = (issueId: number, voteType: 'up' | 'down') => {
    setIssues(prevIssues =>
      prevIssues.map(issue => {
        if (issue.id === issueId) {
          const previousVote = issue.userVote;
          let newUpvotes = issue.upvotes;
          let newDownvotes = issue.downvotes;

          // Remove previous vote
          if (previousVote === 'up') newUpvotes--;
          if (previousVote === 'down') newDownvotes--;

          // Add new vote
          if (voteType === 'up' && previousVote !== 'up') newUpvotes++;
          if (voteType === 'down' && previousVote !== 'down') newDownvotes++;

          return {
            ...issue,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: previousVote === voteType ? null : voteType
          };
        }
        return issue;
      })
    );
  };

  const handleCommentVote = (issueId: number, commentId: number, voteType: 'up' | 'down') => {
    setIssues(prevIssues =>
      prevIssues.map(issue => {
        if (issue.id === issueId) {
          const updatedComments = issue.comments.map(comment => {
            if (comment.id === commentId) {
              const previousVote = comment.userVote;
              let newVotes = comment.votes;

              if (previousVote === voteType) {
                newVotes -= voteType === 'up' ? 1 : -1;
              } else {
                if (previousVote) {
                  newVotes -= previousVote === 'up' ? 1 : -1;
                }
                newVotes += voteType === 'up' ? 1 : -1;
              }

              return {
                ...comment,
                votes: newVotes,
                userVote: previousVote === voteType ? null : voteType
              };
            }
            return comment;
          });
          return { ...issue, comments: updatedComments };
        }
        return issue;
      })
    );
  };

  const handleComment = (issueId: number) => {
    const commentContent = commentInputs[issueId];
    if (!commentContent?.trim()) return;

    const newComment: Comment = {
      id: Math.random(),
      content: commentContent,
      author: user?.email || '',
      isAdmin: user?.role === 'admin',
      createdAt: new Date().toLocaleString(),
      votes: 0,
      userVote: null
    };

    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? { ...issue, comments: [...issue.comments, newComment] }
          : issue
      )
    );

    setCommentInputs(prev => ({ ...prev, [issueId]: '' }));
  };

  const toggleComments = (issueId: number) => {
    setShowComments(prev => ({ ...prev, [issueId]: !prev[issueId] }));
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex">
              {/* Reddit-style Voting Section */}
              <div className="w-10 bg-gray-50 dark:bg-gray-900 rounded-l-lg flex flex-col items-center py-2">
                <button
                  onClick={() => handleVote(issue.id, 'up')}
                  className={`p-1 transition-colors ${
                    issue.userVote === 'up'
                      ? 'text-orange-500'
                      : 'text-gray-400 hover:text-orange-500'
                  }`}
                >
                  <ArrowBigUp className="h-6 w-6" />
                </button>
                <span className={`text-sm font-bold ${
                  issue.userVote === 'up' ? 'text-orange-500' :
                  issue.userVote === 'down' ? 'text-blue-500' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {issue.upvotes - issue.downvotes}
                </span>
                <button
                  onClick={() => handleVote(issue.id, 'down')}
                  className={`p-1 transition-colors ${
                    issue.userVote === 'down'
                      ? 'text-blue-500'
                      : 'text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <ArrowBigDown className="h-6 w-6" />
                </button>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-4">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="flex items-center">
                    Posted by {issue.author}
                    {issue.isAdmin && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-sm text-xs font-medium">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="mx-1">•</span>
                  <span>{issue.createdAt}</span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded-sm text-xs font-medium
                    ${issue.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {issue.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{issue.description}</p>

                {/* Reddit-style Action Bar */}
                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => toggleComments(issue.id)}
                    className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{issue.comments.length} Comments</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md">
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">Share</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md">
                    <Flag className="h-4 w-4" />
                    <span className="text-xs">Report</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[issue.id] && (
                  <div className="mt-4 space-y-4">
                    {/* Comment Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={commentInputs[issue.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [issue.id]: e.target.value }))}
                        placeholder="Add a comment..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        onClick={() => handleComment(issue.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Comments List */}
                    {issue.comments.map((comment) => (
                      <div key={comment.id} className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.author}
                          </span>
                          {comment.isAdmin && (
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-sm text-xs font-medium">
                              Admin
                            </span>
                          )}
                          <span className="mx-1">•</span>
                          <span>{comment.createdAt}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{comment.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => handleCommentVote(issue.id, comment.id, 'up')}
                            className={`flex items-center space-x-1 ${
                              comment.userVote === 'up' ? 'text-orange-500' : 'hover:text-orange-500'
                            }`}
                          >
                            <ArrowBigUp className="h-4 w-4" />
                          </button>
                          <span className={`font-bold ${
                            comment.userVote === 'up' ? 'text-orange-500' :
                            comment.userVote === 'down' ? 'text-blue-500' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {comment.votes}
                          </span>
                          <button
                            onClick={() => handleCommentVote(issue.id, comment.id, 'down')}
                            className={`flex items-center space-x-1 ${
                              comment.userVote === 'down' ? 'text-blue-500' : 'hover:text-blue-500'
                            }`}
                          >
                            <ArrowBigDown className="h-4 w-4" />
                          </button>
                          <button className="hover:text-blue-500">Reply</button>
                          <button className="hover:text-blue-500">Share</button>
                          <button className="hover:text-blue-500">Report</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}