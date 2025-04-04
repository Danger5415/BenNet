import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAssignmentStore } from '../store/assignmentStore';
import { Plus, Upload, Download, Search, Edit2, Trash2, X, AlertCircle, Calendar, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUpload from '../components/ImageUpload';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  subject: string;
  due_date: string;
  total_points: number;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  last_updated: string;
  is_published: boolean;
  teacher?: {
    full_name: string;
    email: string;
  };
}

interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date: string;
  file_url: string;
  file_name: string;
  file_size: number;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: 'draft' | 'submitted' | 'graded' | 'late';
  student?: {
    full_name: string;
    email: string;
  };
}

export default function Assignments() {
  const { user } = useAuthStore();
  const { 
    assignments, 
    submissions,
    loading, 
    error,
    fetchAssignments,
    fetchSubmissions,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    clearError
  } = useAssignmentStore();

  const [showForm, setShowForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionFile, setSubmissionFile] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject: '',
    due_date: '',
    total_points: 100,
    file_url: '',
    file_name: '',
    is_published: true
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment && (user?.role === 'admin' || user?.role === 'teacher')) {
      fetchSubmissions(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, newAssignment);
      } else {
        await addAssignment({
          ...newAssignment,
          teacher_id: user?.id || ''
        });
      }
      setShowForm(false);
      setEditingAssignment(null);
      setNewAssignment({
        title: '',
        description: '',
        subject: '',
        due_date: '',
        total_points: 100,
        file_url: '',
        file_name: '',
        is_published: true
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save assignment');
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionFile) return;

    try {
      await submitAssignment({
        assignment_id: selectedAssignment.id,
        student_id: user?.id || '',
        file_url: submissionFile.url,
        file_name: submissionFile.name,
        file_size: submissionFile.size
      });
      setShowSubmitForm(false);
      setSubmissionFile(null);
      alert('Assignment submitted successfully!');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to submit assignment');
    }
  };

  const handleFileUpload = async (url: string) => {
    if (showForm) {
      setNewAssignment({
        ...newAssignment,
        file_url: url,
        file_name: url.split('/').pop() || ''
      });
    } else {
      setSubmissionFile({
        url,
        name: url.split('/').pop() || '',
        size: 0 // You might want to get the actual file size
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteAssignment(id);
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    try {
      await gradeSubmission(submissionId, grade, feedback);
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Assignments</h1>
        {isTeacher && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button
            onClick={clearError}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
        <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 ml-2" />
        <input
          type="text"
          placeholder="Search assignments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ml-2 flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {assignment.title}
                </h3>
                {isTeacher && assignment.teacher_id === user?.id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingAssignment(assignment);
                        setNewAssignment({
                          title: assignment.title,
                          description: assignment.description || '',
                          subject: assignment.subject,
                          due_date: assignment.due_date,
                          total_points: assignment.total_points,
                          file_url: assignment.file_url || '',
                          file_name: assignment.file_name || '',
                          is_published: assignment.is_published
                        });
                        setShowForm(true);
                      }}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{assignment.description}</p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Due: {format(new Date(assignment.due_date), 'PPP')}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Points: {assignment.total_points}
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                {assignment.file_url && (
                  <a
                    href={assignment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-500 hover:text-blue-600"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Instructions
                  </a>
                )}
                {isStudent ? (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowSubmitForm(true);
                    }}
                    className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Submit Assignment
                  </button>
                ) : (
                  isTeacher && assignment.teacher_id === user?.id && (
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="flex items-center text-blue-500 hover:text-blue-600"
                    >
                      View Submissions
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Assignment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAssignment(null);
                  setFormError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={newAssignment.subject}
                  onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Points
                </label>
                <input
                  type="number"
                  value={newAssignment.total_points}
                  onChange={(e) => setNewAssignment({ ...newAssignment, total_points: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignment Instructions File
                </label>
                <ImageUpload
                  onImageUpload={handleFileUpload}
                  existingImage={newAssignment.file_url}
                  bucket="assignments"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAssignment.is_published}
                  onChange={(e) => setNewAssignment({ ...newAssignment, is_published: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Publish immediately
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAssignment(null);
                    setFormError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingAssignment ? 'Update' : 'Add'} Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitForm && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Submit Assignment: {selectedAssignment.title}
              </h3>
              <button
                onClick={() => {
                  setShowSubmitForm(false);
                  setSubmissionFile(null);
                  setFormError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Your Work
                </label>
                <ImageUpload
                  onImageUpload={handleFileUpload}
                  existingImage={submissionFile?.url}
                  bucket="assignment-submissions"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitForm(false);
                    setSubmissionFile(null);
                    setFormError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={!submissionFile}
                >
                  Submit Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {selectedAssignment && isTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Submissions for: {selectedAssignment.title}
              </h3>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submission Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {submission.student?.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.student?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(submission.submission_date), 'PPp')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          submission.status === 'graded'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : submission.status === 'late'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {submission.grade !== null ? `${submission.grade}/100` : 'Not graded'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {submission.file_url && (
                            <a
                              href={submission.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              const grade = prompt('Enter grade (0-100):', submission.grade?.toString() || '');
                              const feedback = prompt('Enter feedback:', submission.feedback || '');
                              if (grade !== null && feedback !== null) {
                                handleGradeSubmission(submission.id, parseInt(grade), feedback);
                              }
                            }}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}