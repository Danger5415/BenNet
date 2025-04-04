import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useStudyMaterialStore } from '../store/studyMaterialStore';
import { Book, FileText, Download, Plus, Edit2, Trash2, X, Check, AlertCircle, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ImageUpload from '../components/ImageUpload';

export default function StudyMaterial() {
  const { user } = useAuthStore();
  const { 
    materials, 
    categories,
    loading,
    error,
    fetchMaterials,
    fetchCategories,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addCategory,
    clearError
  } = useStudyMaterialStore();

  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    subject: '',
    category_id: '',
    file_url: '',
    file_name: '',
    file_size: 0,
    file_type: '',
    is_published: true
  });

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, newMaterial);
      } else {
        await addMaterial({
          ...newMaterial,
          teacher_id: user?.id || ''
        });
      }
      setShowForm(false);
      setEditingMaterial(null);
      setNewMaterial({
        title: '',
        description: '',
        subject: '',
        category_id: '',
        file_url: '',
        file_name: '',
        file_size: 0,
        file_type: '',
        is_published: true
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save material');
    }
  };

  const handleFileUpload = async (url: string) => {
    setNewMaterial({
      ...newMaterial,
      file_url: url,
      file_name: url.split('/').pop() || '',
      file_size: 0, // You might want to get the actual file size
      file_type: url.split('.').pop() || ''
    });
  };

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || material.category_id === selectedCategory;
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Study Materials</h1>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
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

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Categories</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All Materials
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="ml-4">
                <button className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map(material => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-500 mr-2" />
                        <h3 className="text-lg font-medium dark:text-white">{material.title}</h3>
                      </div>
                      {material.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                          {material.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{material.description}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Subject: {material.subject}</p>
                      <p>Uploaded: {format(new Date(material.upload_date), 'MMM d, yyyy')}</p>
                      <p>Downloads: {material.downloads}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <a
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:text-blue-600"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                      {(user?.role === 'admin' || (user?.role === 'teacher' && material.teacher_id === user.id)) && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingMaterial(material);
                              setNewMaterial({
                                title: material.title,
                                description: material.description || '',
                                subject: material.subject,
                                category_id: material.category_id || '',
                                file_url: material.file_url,
                                file_name: material.file_name,
                                file_size: material.file_size,
                                file_type: material.file_type,
                                is_published: material.is_published
                              });
                              setShowForm(true);
                            }}
                            className="text-yellow-500 hover:text-yellow-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this material?')) {
                                deleteMaterial(material.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Material Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingMaterial(null);
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
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
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
                  value={newMaterial.subject}
                  onChange={(e) => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={newMaterial.category_id}
                  onChange={(e) => setNewMaterial({ ...newMaterial, category_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File
                </label>
                <ImageUpload
                  onImageUpload={handleFileUpload}
                  existingImage={newMaterial.file_url}
                  bucket="study-materials"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newMaterial.is_published}
                  onChange={(e) => setNewMaterial({ ...newMaterial, is_published: e.target.checked })}
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
                    setEditingMaterial(null);
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
                  {editingMaterial ? 'Update' : 'Add'} Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}