import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { QrCode, Clock, Calendar, CheckCircle, Plus, X, Edit2, Trash2, Users, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Class {
  id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  teacher: string;
  qrCode?: string;
}

interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  studentEmail: string;
  date: string;
  status: 'present' | 'absent';
  markedBy?: string;
  timestamp: string;
}

interface Student {
  id: string;
  email: string;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00'
];

// Mock students data
const mockStudents: Student[] = [
  { id: '2', email: 'student@campus.edu' },
  { id: '3', email: 'student2@campus.edu' },
  { id: '4', email: 'student3@campus.edu' },
];

export default function Timetable() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([
    {
      id: '1',
      subject: 'Mathematics',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Room 101',
      teacher: 'Dr. Smith'
    },
    {
      id: '2',
      subject: 'Physics',
      day: 'Monday',
      startTime: '11:00',
      endTime: '12:00',
      room: 'Room 102',
      teacher: 'Dr. Johnson'
    }
  ]);

  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const [newClass, setNewClass] = useState<Omit<Class, 'id'>>({
    subject: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    teacher: ''
  });

  useEffect(() => {
    if (showQR && selectedClass?.qrCode) {
      generateQRCodeUrl(selectedClass.qrCode);
    }
  }, [showQR, selectedClass]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
        handleQRScanned(decodedText);
        if (scanner) {
          scanner.clear();
        }
      }, console.error);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showScanner]);

  const generateQRCodeUrl = async (data: string) => {
    try {
      const url = await QRCode.toDataURL(data);
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const generateQRCode = (classId: string) => {
    const timestamp = new Date().getTime();
    const uniqueCode = `${classId}-${timestamp}-${Math.random().toString(36).substring(7)}`;
    setClasses(prevClasses =>
      prevClasses.map(cls =>
        cls.id === classId ? { ...cls, qrCode: uniqueCode } : cls
      )
    );
    return uniqueCode;
  };

  const handleGenerateQR = (classItem: Class) => {
    setSelectedClass(classItem);
    const qrCode = generateQRCode(classItem.id);
    generateQRCodeUrl(qrCode);
    setShowQR(true);
  };

  const handleViewAttendance = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowAttendance(true);
  };

  const handleScanQR = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowScanner(true);
  };

  const handleQRScanned = (data: string) => {
    if (!data || !selectedClass || !user) return;

    const [classId, timestamp] = data.split('-');
    const scanTime = new Date().getTime();
    const qrTimestamp = parseInt(timestamp);

    // QR code is valid for 5 minutes
    if (scanTime - qrTimestamp > 300000) {
      alert('QR code has expired');
      return;
    }

    if (classId === selectedClass.id) {
      const newAttendance: Attendance = {
        id: Math.random().toString(),
        classId: selectedClass.id,
        studentId: user.id,
        studentEmail: user.email,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        timestamp: new Date().toISOString(),
      };

      setAttendanceRecords(prev => {
        // Check if attendance already exists for this student and class today
        const existingRecord = prev.find(
          record => 
            record.classId === newAttendance.classId && 
            record.studentId === newAttendance.studentId &&
            record.date === newAttendance.date
        );

        if (existingRecord) {
          alert('Attendance already marked for today');
          return prev;
        }

        alert('Attendance marked successfully!');
        return [...prev, newAttendance];
      });
    } else {
      alert('Invalid QR code for this class');
    }

    setShowScanner(false);
  };

  const handleManualAttendance = (studentId: string, studentEmail: string, present: boolean) => {
    if (!selectedClass) return;

    setAttendanceRecords(prev => {
      const existingRecord = prev.find(
        record => 
          record.classId === selectedClass.id && 
          record.studentId === studentId &&
          record.date === new Date().toISOString().split('T')[0]
      );

      if (existingRecord) {
        return prev.map(record => 
          record === existingRecord
            ? { ...record, status: present ? 'present' : 'absent', markedBy: user?.email }
            : record
        );
      }

      return [...prev, {
        id: Math.random().toString(),
        classId: selectedClass.id,
        studentId,
        studentEmail,
        date: new Date().toISOString().split('T')[0],
        status: present ? 'present' : 'absent',
        markedBy: user?.email,
        timestamp: new Date().toISOString(),
      }];
    });
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setNewClass({
      subject: '',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      teacher: ''
    });
    setShowClassForm(true);
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setNewClass({
      subject: classItem.subject,
      day: classItem.day,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      room: classItem.room,
      teacher: classItem.teacher
    });
    setShowClassForm(true);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      setClasses(prevClasses => prevClasses.filter(cls => cls.id !== classId));
      setAttendanceRecords(prev => prev.filter(record => record.classId !== classId));
    }
  };

  const handleSubmitClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      setClasses(prevClasses =>
        prevClasses.map(cls =>
          cls.id === editingClass.id
            ? { ...newClass, id: editingClass.id }
            : cls
        )
      );
    } else {
      const newClassItem = {
        ...newClass,
        id: Math.random().toString(),
      };
      setClasses(prev => [...prev, newClassItem]);
    }
    setShowClassForm(false);
  };

  const getAttendanceForClass = (classId: string) => {
    return attendanceRecords.find(
      record =>
        record.classId === classId &&
        record.studentId === user?.id &&
        record.date === new Date().toISOString().split('T')[0]
    );
  };

  const getAttendanceStats = (classId: string) => {
    const todayRecords = attendanceRecords.filter(
      record => 
        record.classId === classId &&
        record.date === new Date().toISOString().split('T')[0]
    );

    return {
      present: todayRecords.filter(record => record.status === 'present').length,
      total: mockStudents.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Timetable</h1>
        {user?.role === 'admin' && (
          <button
            onClick={handleAddClass}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Time
              </th>
              {days.map(day => (
                <th
                  key={day}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {timeSlot}
                </td>
                {days.map(day => {
                  const classForSlot = classes.find(
                    cls =>
                      cls.day === day &&
                      `${cls.startTime}-${cls.endTime}` === timeSlot
                  );

                  return (
                    <td
                      key={`${day}-${timeSlot}`}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {classForSlot && (
                        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                          <div className="font-medium text-blue-700 dark:text-blue-200">
                            {classForSlot.subject}
                          </div>
                          <div className="text-sm text-blue-500 dark:text-blue-300">
                            {classForSlot.room}
                          </div>
                          <div className="text-sm text-blue-500 dark:text-blue-300">
                            {classForSlot.teacher}
                          </div>
                          <div className="flex items-center mt-2 space-x-2">
                            {user?.role === 'admin' ? (
                              <>
                                <button
                                  onClick={() => handleGenerateQR(classForSlot)}
                                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                                >
                                  <QrCode className="h-4 w-4 mr-1" />
                                  Generate QR
                                </button>
                                <button
                                  onClick={() => handleViewAttendance(classForSlot)}
                                  className="flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-800"
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  View Attendance
                                </button>
                                <button
                                  onClick={() => handleEditClass(classForSlot)}
                                  className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800"
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClass(classForSlot.id)}
                                  className="flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleScanQR(classForSlot)}
                                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                              >
                                <QrCode className="h-4 w-4 mr-1" />
                                Scan QR
                              </button>
                            )}
                          </div>
                          {user?.role === 'admin' && (
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              {(() => {
                                const stats = getAttendanceStats(classForSlot.id);
                                return `${stats.present}/${stats.total} present`;
                              })()}
                            </div>
                          )}
                          {user?.role === 'student' && getAttendanceForClass(classForSlot.id) && (
                            <div className="mt-2 flex items-center text-sm text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Present
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Code Modal */}
      {showQR && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Attendance QR Code for {selectedClass.subject}
              </h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This QR code will expire in 5 minutes
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Scan Attendance QR Code
              </h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div id="qr-reader" className="w-full"></div>
            <button
              onClick={() => setShowScanner(false)}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Attendance View Modal */}
      {showAttendance && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Attendance for {selectedClass.subject}
              </h3>
              <button
                onClick={() => setShowAttendance(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Marked By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockStudents.map(student => {
                      const attendance = attendanceRecords.find(
                        record => 
                          record.classId === selectedClass.id && 
                          record.studentId === student.id &&
                          record.date === new Date().toISOString().split('T')[0]
                      );

                      return (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attendance?.status === 'present'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : attendance?.status === 'absent'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {attendance?.status || 'Not Marked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {attendance?.markedBy || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleManualAttendance(student.id, student.email, true)}
                                className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleManualAttendance(student.id, student.email, false)}
                                className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAttendance(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Form Modal */}
      {showClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h3>
              <button
                onClick={() => setShowClassForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Day
                  </label>
                  <select
                    value={newClass.day}
                    onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room
                  </label>
                  <input
                    type="text"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newClass.startTime}
                    onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newClass.endTime}
                    onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teacher
                </label>
                <input
                  type="text"
                  value={newClass.teacher}
                  onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowClassForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingClass ? 'Update' : 'Add'} Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}