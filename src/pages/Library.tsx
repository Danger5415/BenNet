import React, { useState } from 'react';
import { Search, Book, Clock, User, Calendar, Download, ExternalLink } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  dueDate?: string;
  coverUrl: string;
  description: string;
}

interface LibraryAccount {
  id: string;
  books: {
    id: string;
    title: string;
    dueDate: string;
    renewals: number;
  }[];
  fines: {
    amount: number;
    reason: string;
    dueDate: string;
  }[];
}

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'account'>('search');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const [searchResults] = useState<Book[]>([
    {
      id: '1',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '978-0262033848',
      available: true,
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      description: 'A comprehensive introduction to algorithms and their analysis.'
    },
    {
      id: '2',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      available: false,
      dueDate: '2024-04-15',
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      description: 'A handbook of agile software craftsmanship.'
    }
  ]);

  const [account] = useState<LibraryAccount>({
    id: '123',
    books: [
      {
        id: '1',
        title: 'Clean Code',
        dueDate: '2024-04-15',
        renewals: 1
      }
    ],
    fines: [
      {
        amount: 5.00,
        reason: 'Late return',
        dueDate: '2024-03-01'
      }
    ]
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Library</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'search'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Search Books
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'account'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            My Account
          </button>
          <a
            href="https://bennett.refread.com/#/home"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Library Portal
          </a>
        </div>
      </div>

      {activeTab === 'search' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  'Search'
                )}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchResults.map((book) => (
              <div
                key={book.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-32 h-40 object-cover"
                  />
                  <div className="p-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {book.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">{book.author}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      ISBN: {book.isbn}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {book.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          book.available
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {book.available ? 'Available' : `Due: ${book.dueDate}`}
                      </span>
                      <button
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => window.open('https://library.bennett.edu.in/', '_blank')}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Borrowed Books</h2>
            <div className="space-y-4">
              {account.books.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <Book className="h-6 w-6 text-blue-500 mr-3" />
                    <div>
                      <h3 className="font-medium dark:text-white">{book.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        Due: {book.dueDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      onClick={() => window.open('https://bennett.refread.com/#/profile', '_blank')}
                    >
                      Renew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Fines</h2>
            <div className="space-y-4">
              {account.fines.map((fine, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-red-500">₹{fine.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{fine.reason}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Due: {fine.dueDate}</p>
                  </div>
                  <button
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                    onClick={() => window.open('https://bennett.refread.com/#/home', '_blank')}
                  >
                    Pay Fine
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium mb-4 dark:text-white">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://library.bennett.edu.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Calendar className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium dark:text-white">Library Calendar</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View library hours and events</p>
                </div>
              </a>
              <a
                href="https://library.bennett.edu.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium dark:text-white">E-Resources</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Access digital library resources</p>
                </div>
              </a>
              <a
                href="https://bennett.refread.com/#/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <User className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium dark:text-white">Account Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your library account</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}