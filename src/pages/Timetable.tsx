import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { QrCode, Clock, Calendar, CheckCircle } from 'lucide-react';
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
  date: string;
  status: 'present' | 'absent';
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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (showQR && selectedClass?.qrCode) {
      QRCode.toDataURL(selectedClass.qrCode)
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(console.error);
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
    generateQRCode(classItem.id);
    setShowQR(true);
  };

  const handleScanQR = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowScanner(true);
  };

  const handleQRScanned = (data: string) => {
    if (!data || !selectedClass) return;

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
        studentId: user?.id || '',
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      };

      setAttendanceRecords(prev => [...prev, newAttendance]);
      alert('Attendance marked successfully!');
    } else {
      alert('Invalid QR code for this class');
    }

    setShowScanner(false);
  };

  const getAttendanceForClass = (classId: string) => {
    return attendanceRecords.find(
      record =>
        record.classId === classId &&
        record.studentId === user?.id &&
        record.date === new Date().toISOString().split('T')[0]
    );
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
                          {user?.role === 'admin' ? (
                            <button
                              onClick={() => handleGenerateQR(classForSlot)}
                              className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Generate QR
                            </button>
                          ) : (
                            <button
                              onClick={() => handleScanQR(classForSlot)}
                              className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Scan QR
                            </button>
                          )}
                          {getAttendanceForClass(classForSlot.id) && (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Attendance QR Code for {selectedClass.subject}
            </h3>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Scan Attendance QR Code
            </h3>
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
    </div>
  );
}