import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useStudentStore } from '../store/studentStore';
import { useTimetableStore } from '../store/timetableStore';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Users, 
  MessageSquare, 
  ZoomIn, 
  ZoomOut, 
  Settings, 
  X, 
  Check,
  QrCode,
  Edit2,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';

interface Class {
  id: string;
  subject: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
  teacher: string;
  teacher_email: string;
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
    teacher: 'Sounak Sadukhan',
    teacher_email: 'sounak.sadukhan@bennett.edu.in'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    subject: 'Computer Networks',
    day: 'Tuesday',
    start_time: '08:30',
    end_time: '09:30',
    room: '011 N CC',
    teacher: 'Thipendra pal Singh',
    teacher_email: 'thipendra.singh@bennett.edu.in'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    subject: 'Computer Networks',
    day: 'Tuesday',
    start_time: '10:40',
    end_time: '12:35',
    room: 'P LA 001',
    teacher: 'Lalitesh Chaudhary',
    teacher_email: 'lalitesh.chaudhary@bennett.edu.in'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    subject: 'Operating System',
    day: 'Tuesday',
    start_time: '13:35',
    end_time: '15:25',
    room: 'P LA 203',
    teacher: 'Priyanka Chandani',
    teacher_email: 'priyanka.chandani@bennett.edu.in'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    subject: 'Design and Analysis of Algorithm',
    day: 'Wednesday',
    start_time: '14:30',
    end_time: '15:35',
    room: 'P CC 210',
    teacher: 'Purushottam Kumar',
    teacher_email: 'purushottam.kumar@bennett.edu.in'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    subject: 'Design Thinking and Innovation',
    day: 'Thursday',
    start_time: '13:35',
    end_time: '15:25',
    room: '214 N LA',
    teacher: 'Madhushi Verma',
    teacher_email: 'madhushi.verma@bennett.edu.in'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    subject: 'System and Network Security',
    day: 'Friday',
    start_time: '10:40',
    end_time: '12:35',
    room: 'P LA 206',
    teacher: 'Achyut Shankar Sinha',
    teacher_email: 'achyut.sinha@bennett.edu.in'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174008',
    subject: 'Operating Systems',
    day: 'Friday',
    start_time: '14:30',
    end_time: '15:25',
    room: 'P CC 210',
    teacher: 'Priyanka Chandani',
    teacher_email: 'priyanka.chandani@bennett.edu.in'
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

  // New state for admin editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedClass, setEditedClass] = useState<Class | null>(null);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClass, setNewClass] = useState<Omit<Class, 'id'>>({
    subject: '',
    day: 'Monday',
    start_time: '',
    end_time: '',
    room: '',
    teacher: '',
    teacher_email: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (showQR && selectedClass?.qrCode) {
      generateQRCodeUrl(selectedClass.qrCode);
      setQrTimer(30);
      
      const interval = setInterval(() => {
        setQrTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowQR(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
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
      const qrCode = `${classItem.id}-${Date.now()}`;
      await generateQRCodeUrl(qrCode);
      setShowQR(true);
      
      // Update the class with the new QR code
      const updatedClass = { ...classItem, qrCode };
      setSelectedClass(updatedClass);
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

      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', selectedClass.teacher_email)
        .single();

      if (teacherError || !teacherData) {
        throw new Error('Teacher not found');
      }

      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert({
          student_id: studentData.id,
          class_id: selectedClass.id,
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          marked_by: teacherData.id,
          marked_via: 'qr',
          qr_code: data,
          qr_expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }, {
          onConflict: 'student_id,class_id,date'
        });

      if (attendanceError) throw attendanceError;

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
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', selectedClass.teacher_email)
        .single();

      if (teacherError || !teacherData) {
        throw new Error('Teacher not found. Please check the class configuration.');
      }

      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .upsert({
          student_id: studentId,
          class_id: selectedClass.id,
          date: new Date().toISOString().split('T')[0],
          status: present ? 'present' : 'absent',
          marked_by: teacherData.id,
          marked_via: 'manual'
        }, {
          onConflict: 'student_id,class_id,date'
        });

      if (attendanceError) throw attendanceError;

      await fetchAttendance(selectedClass.id);
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

  // Admin functions for editing timetable
  const handleEditClass = (classItem: Class) => {
    setEditedClass(classItem);
    setIsEditing(true);
  };

  const handleSaveClass = async () => {
    if (!editedClass) return;

    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({
          subject: editedClass.subject,
          day: editedClass.day,
          start_time: editedClass.start_time,
          end_time: editedClass.end_time,
          room: editedClass.room,
          teacher: editedClass.teacher,
          teacher_email: editedClass.teacher_email
        })
        .eq('id', editedClass.id);

      if (error) throw error;

      setClasses(classes.map(c => c.id === editedClass.id ? editedClass : c));
      setIsEditing(false);
      setEditedClass(null);
      alert('Class updated successfully!');
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class. Please try again.');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      setClasses(classes.filter(c => c.id !== classId));
      alert('Class deleted successfully!');
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    }
  };

  const handleAddClass = async () => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .insert([{
          subject: newClass.subject,
          day: newClass.day,
          start_time: newClass.start_time,
          end_time: newClass.end_time,
          room: newClass.room,
          teacher: newClass.teacher,
          teacher_email: newClass.teacher_email
        }])
        .select()
        .single();

      if (error) throw error;

      setClasses([...classes, data as Class]);
      setShowAddClassForm(false);
      setNewClass({
        subject: '',
        day: 'Monday',
        start_time: '',
        end_time: '',
        room: '',
        teacher: '',
        teacher_email: ''
      });
      alert('Class added successfully!');
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to add class. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-white">Timetable</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddClassForm(true)}
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
                            {user?.role === 'admin' ? (
                              <>
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
                            ) : (user?.role === 'admin' || user?.role === 'teacher') ? (
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

      {/* Edit Class Modal */}
      {isEditing && editedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Edit Class
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedClass(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={editedClass.subject}
                  onChange={(e) => setEditedClass({ ...editedClass, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Day
                </label>
                <select
                  value={editedClass.day}
                  onChange={(e) => setEditedClass({ ...editedClass, day: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={editedClass.start_time}
                    onChange={(e) => setEditedClass({ ...editedClass, start_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:MM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={editedClass.end_time}
                    onChange={(e) => setEditedClass({ ...editedClass, end_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:MM"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Room
                </label>
                <input
                  type="text"
                  value={editedClass.room}
                  onChange={(e) => setEditedClass({ ...editedClass, room: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teacher
                </label>
                <input
                  type="text"
                  value={editedClass.teacher}
                  onChange={(e) => setEditedClass({ ...editedClass, teacher: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teacher Email
                </label>
                <input
                  type="email"
                  value={editedClass.teacher_email}
                  onChange={(e) => setEditedClass({ ...editedClass, teacher_email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedClass(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveClass}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add New Class
              </h3>
              <button
                onClick={() => setShowAddClassForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Day
                </label>
                <select
                  value={newClass.day}
                  onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={newClass.start_time}
                    onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:MM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={newClass.end_time}
                    onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:MM"
                    required
                  />
                </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teacher Email
                </label>
                <input
                  type="email"
                  value={newClass.teacher_email}
                  onChange={(e) => setNewClass({ ...newClass, teacher_email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddClassForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddClass}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing modals (QR Code, Scanner, Attendance) remain unchanged */}
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