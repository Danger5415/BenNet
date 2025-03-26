import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  existingImage?: string;
  bucket?: string;
}

export default function ImageUpload({ onImageUpload, existingImage, bucket = 'images' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (urlError) throw urlError;

      onImageUpload(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Error uploading image');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
      setError(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Error accessing camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      await handleFileSelect(file);
      stopCamera();
    }, 'image/jpeg', 0.8); // 0.8 quality for better file size
  };

  const removeImage = () => {
    setPreview(null);
    onImageUpload('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!showCamera && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose Image
          </button>
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            disabled={loading}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {showCamera && (
        <div className="relative rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {preview && !showCamera && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}