import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { QrCode, Clock, Calendar, CheckCircle, Plus, X, Edit2, Trash2, Users, Check, ZoomIn, ZoomOut } from 'lucide-react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimetableStore } from '../store/timetableStore';

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

export default function Timetable() {
  const { user } = useAuthStore();
  const { 
    students, 
    attendanceRecords, 
    loading, 
    error,
    fetchStudents,
    fetchAttendance,
    markAttendance,
    generateQRCode: generateQRCodeStore
  } = useTimetableStore();

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [qrTimer, setQrTimer] = useState<number>(30);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [newClass, setNewClass] = useState<Omit<Class, 'id'>>({
    subject: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    teacher: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .order('start_time');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    if (showQR && selectedClass?.qrCode) {
      generateQRCodeUrl(selectedClass.qrCode);
      setQrTimer(30);
      timerRef.current = setInterval(() => {
        setQrTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setShowQR(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showQR, selectedClass]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          videoConstraints: {
            facingMode: { exact: "environment" }
          }
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          handleQRScanned(decodedText);
        },
        (errorMessage) => {
          if (!errorMessage.includes('NotFound')) {
            console.error('QR Scan error:', errorMessage);
          }
        }
      );
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

  const handleGenerateQR = async (classItem: Class) => {
    try {
      setSelectedClass(classItem);
      const qrCode = await generateQRCodeStore(classItem.id);
      await generateQRCodeUrl(qrCode);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleQRScanned = async (data: string) => {
    if (!data || !selectedClass || !user) return;

    try {
      // Parse QR code data
      const [classId, timestamp] = data.split('-');
      const scanTime = new Date().getTime();
      const qrTimestamp = parseInt(timestamp);

      // QR code is valid for 30 seconds
      if (scanTime - qrTimestamp > 30000) {
        alert('QR code has expired. Please ask the teacher to generate a new one.');
        setShowScanner(false);
        return;
      }

      if (classId !== selectedClass.id) {
        alert('Invalid QR code for this class');
        setShowScanner(false);
        return;
      }

      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .single();

      if (studentError || !studentData) {
        throw new Error('Student not found');
      }

      // Mark attendance
      await markAttendance({
        studentId: studentData.id,
        classId: selectedClass.id,
        status: 'present',
        markedVia: 'qr',
        qrCode: data
      });

      alert('Attendance marked successfully!');
      setShowScanner(false);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
      setShowScanner(false);
    }
  };

  const handleManualAttendance = async (studentId: string, present: boolean) => {
    if (!selectedClass || !user) return;

    try {
      await markAttendance({
        studentId,
        classId: selectedClass.id,
        status: present ? 'present' : 'absent',
        markedVia: 'manual'
      });

      alert(`Attendance ${present ? 'marked' : 'unmarked'} successfully!`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };

  const handleViewAttendance = async (classItem: Class) => {
    setSelectedClass(classItem);
    await fetchAttendance(classItem.id);
    setShowAttendance(true);
  };

  const handleZoomIn = () => {
    try {
      const track = scannerRef.current?.getVideoElement()?.srcObject?.getVideoTracks()[0];
      if (track?.getCapabilities?.()?.zoom) {
        const capabilities = track.getCapabilities();
        const settings = track.getSettings();
        const newZoom = Math.min(
          settings.zoom + (capabilities.zoom.step || 1),
          capabilities.zoom.max
        );
        track.applyConstraints({
          advanced: [{ zoom: newZoom }]
        });
        setZoomLevel(newZoom);
      }
    } catch (error) {
      console.error('Error updating zoom:', error);
    }
  };

  const handleZoomOut = () => {
    try {
      const track = scannerRef.current?.getVideoElement()?.srcObject?.getVideoTracks()[0];
      if (track?.getCapabilities?.()?.zoom) {
        const capabilities = track.getCapabilities();
        const settings = track.getSettings();
        const newZoom = Math.max(
          settings.zoom - (capabilities.zoom.step || 1),
          capabilities.zoom.min
        );
        track.applyConstraints({
          advanced: [{ zoom: newZoom }]
        });
        setZoomLevel(newZoom);
      }
    } catch (error) {
      console.error('Error updating zoom:', error);
    }
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

  const handleDeleteClass = async (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        const { error } = await supabase
          .from('class_schedules')
          .delete()
          .eq('id', classId);

        if (error) throw error;

        setClasses(prevClasses => prevClasses.filter(cls => cls.id !== classId));
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class. Please try again.');
      }
    }
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        const { error } = await supabase
          .from('class_schedules')
          .update({
            subject: newClass.subject,
            day: newClass.day,
            start_time: newClass.startTime,
            end_time: newClass.endTime,
            room: newClass.room,
            teacher: newClass.teacher
          })
          .eq('id', editingClass.id);

        if (error) throw error;

        setClasses(prevClasses =>
          prevClasses.map(cls =>
            cls.id === editingClass.id
              ? { ...newClass, id: editingClass.id }
              : cls
          )
        );
      } else {
        const { data, error } = await supabase
          .from('class_schedules')
          .insert({
            subject: newClass.subject,
            day: newClass.day,
            start_time: newClass.startTime,
            end_time: newClass.endTime,
            room: newClass.room,
            teacher: newClass.teacher
          })
          .select()
          .single();

        if (error) throw error;

        setClasses(prev => [...prev, data as Class]);
      }
      setShowClassForm(false);
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class. Please try again.');
    }
  };

  const getAttendanceStats = (classId: string) => {
    const todayRecords = attendanceRecords.filter(
      record => 
        record.classId === classId &&
        record.date === new Date().toISOString().split('T')[0]
    );

    return {
      present: todayRecords.filter(record => record.status === 'present').length,
      total: students.length,
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
                            {(user?.role === 'admin' || user?.role === 'teacher') ? (
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
                                onClick={() => {
                                  setSelectedClass(classForSlot);
                                  setShowScanner(true);
                                }}
                                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                              >
                                <QrCode className="h-4 w-4 mr-1" />
                                Scan QR
                              </button>
                            )}
                          </div>
                          {(user?.role === 'admin' || user?.role === 'teacher') && (
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              {(() => {
                                const stats = getAttendanceStats(classForSlot.id);
                                return `${stats.present}/${stats.total} present`;
                              })()}
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
                onClick={() => {
                  setShowQR(false);
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                  }
                }}
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
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-primary-500">{qrTimer}s</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                QR code will expire in {qrTimer} seconds
              </p>
            </div>
            <button
              onClick={() => {
                setShowQR(false);
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                }
              }}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Scanning Attendance QR Code
              </h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Scanner Container */}
            <div className="relative">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
              
              {/* Custom Zoom Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleZoomOut}
                  className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  <ZoomOut className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleZoomIn}
                  className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  <ZoomIn className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                </motion.button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Point your camera at the QR code shown by your teacher
            </div>
            
            <button
              onClick={() => setShowScanner(false)}
              className="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
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
                    {students.map(student => {
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
                                onClick={() => handleManualAttendance(student.id, true)}
                                className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleManualAttendance(student.id, false)}
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