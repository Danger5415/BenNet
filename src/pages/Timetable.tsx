import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { QrCode, Clock, Calendar, CheckCircle, Plus, X, Edit2, Trash2, Users, Check, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimetableStore } from '../store/timetableStore';

interface Class {
  id: string;
  subject: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
  teacher: string;
  qrCode?: string;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '08:30-09:30',
  '09:30-10:30',
  '10:40-11:35',
  '11:35-12:35',
  '13:35-14:30',
  '14:30-15:25',
  '15:25-16:20'
];

const initialClasses: Class[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    subject: 'Design and Analysis of Algorithm',
    day: 'Monday',
    start_time: '13:35',
    end_time: '14:30',
    room: '012-N-CA',
    teacher: 'Sounak Sadukhan'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    subject: 'Computer Networks',
    day: 'Tuesday',
    start_time: '08:30',
    end_time: '09:30',
    room: '011 N CC',
    teacher: 'Thipendra pal Singh'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    subject: 'Computer Networks',
    day: 'Tuesday',
    start_time: '10:40',
    end_time: '12:35',
    room: 'P LA 001',
    teacher: 'Lalitesh Chaudhary'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    subject: 'Operating System',
    day: 'Tuesday',
    start_time: '13:35',
    end_time: '15:25',
    room: 'P LA 203',
    teacher: 'Priyanka Chandani'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    subject: 'Design and Analysis of Algorithm',
    day: 'Wednesday',
    start_time: '14:30',
    end_time: '15:35',
    room: 'P CC 210',
    teacher: 'Purushottam Kumar'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    subject: 'Design Thinking and Innovation',
    day: 'Thursday',
    start_time: '13:35',
    end_time: '15:25',
    room: '214 N LA',
    teacher: 'Madhushi Verma'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    subject: 'System and Network Security',
    day: 'Friday',
    start_time: '10:40',
    end_time: '12:35',
    room: 'P LA 206',
    teacher: 'Achyut Shankar Sinha'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174008',
    subject: 'Operating Systems',
    day: 'Friday',
    start_time: '14:30',
    end_time: '15:25',
    room: 'P CC 210',
    teacher: 'Priyanka Chandani'
  }
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

  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [qrTimer, setQrTimer] = useState<number>(30);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [newClass, setNewClass] = useState<Omit<Class, 'id'>>({
    subject: '',
    day: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    room: '',
    teacher: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

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
      if (!classItem.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid UUID format for class ID');
      }
      const qrCode = await generateQRCodeStore(classItem.id);
      await generateQRCodeUrl(qrCode);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please ensure the class ID is in the correct format.');
    }
  };

  const handleQRScanned = async (data: string) => {
    if (!data || !selectedClass || !user) return;

    try {
      const [classId, timestamp] = data.split('-');
      const scanTime = new Date().getTime();
      const qrTimestamp = parseInt(timestamp);

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

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .single();

      if (studentError || !studentData) {
        throw new Error('Student not found');
      }

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
    if (!selectedClass || !user) {
      alert('No class selected');
      return;
    }

    try {
      if (!selectedClass.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid class ID format');
      }

      await markAttendance({
        studentId,
        classId: selectedClass.id,
        status: present ? 'present' : 'absent',
        markedVia: 'manual'
      });

      alert(`Attendance ${present ? 'marked' : 'unmarked'} successfully!`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert(error instanceof Error ? error.message : 'Failed to mark attendance. Please try again.');
    }
  };

  const handleViewAttendance = async (classItem: Class) => {
    try {
      setSelectedClass(classItem);
      if (!classItem.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid UUID format for class ID');
      }
      await fetchAttendance(classItem.id);
      setShowAttendance(true);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      alert('Failed to fetch attendance. Please ensure the class ID is in the correct format.');
    }
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

  const getClassForTimeSlot = (day: string, timeSlot: string) => {
    const [slotStart, slotEnd] = timeSlot.split('-');
    return classes.find(cls => {
      const classStart = cls.start_time;
      const classEnd = cls.end_time;
      return cls.day === day && 
             ((classStart >= slotStart && classStart < slotEnd) ||
              (classEnd > slotStart && classEnd <= slotEnd) ||
              (classStart <= slotStart && classEnd >= slotEnd));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Timetable</h1>
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
                  const classForSlot = getClassForTimeSlot(day, timeSlot);

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
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {classForSlot.start_time} - {classForSlot.end_time}
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
    </div>
  );
}