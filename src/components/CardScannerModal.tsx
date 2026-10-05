import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, X, RefreshCw, AlertCircle, Image as ImageIcon, CheckCircle2, SwitchCamera } from 'lucide-react';
import { scanCard } from '../services/api';
import { fileToBase64, SAMPLE_CARD_PRESETS, SampleCardPreset } from '../utils/sampleCards';
import { BusinessCard } from '../types/card';

interface CardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (extractedData: Partial<BusinessCard>, originalImage: string) => void;
}

export const CardScannerModal: React.FC<CardScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'sample'>('camera');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start Camera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ โปรดอนุญาตสิทธิ์กล้องในเบราว์เซอร์ หรือใช้วิธีอัปโหลดไฟล์รูปภาพแทน');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Flip Camera
  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(dataUrl);
    stopCamera();
    processImageWithAI(dataUrl);
  };

  // Handle uploaded file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg(null);
      const base64 = await fileToBase64(file);
      setPreviewImage(base64);
      processImageWithAI(base64);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ');
    }
  };

  // Handle sample preset
  const handleSelectSample = (preset: SampleCardPreset) => {
    setPreviewImage(preset.svgDataUrl);
    processImageWithAI(preset.svgDataUrl);
  };

  // Run AI Extraction
  const processImageWithAI = async (base64Image: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanStep('กำลังส่งภาพนามบัตรไปยังระบบ AI Vision...');

    try {
      setTimeout(() => {
        setScanStep('กำลังวิเคราะห์ข้อความภาษาไทยและอังกฤษด้วย Gemini 3.8...');
      }, 700);

      setTimeout(() => {
        setScanStep('กำลังสกัดชื่อ, บริษัท, ตำแหน่ง, เบอร์โทร, อีเมล, LINE ID...');
      }, 1500);

      const extracted = await scanCard(base64Image);
      setIsScanning(false);
      onScanSuccess(extracted, base64Image);
      onClose();
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      setIsScanning(false);
      setErrorMsg(err.message || 'ระบบไม่สามารถอ่านข้อมูลจากภาพนี้ได้ โปรดลองอีกครั้งหรือกรอกข้อมูลเอง');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                สแกนนามบัตรด้วย AI
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  สกัดข้อมูลอัตโนมัติ
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ถ่ายรูปหรืออัปโหลดนามบัตร ระบบจะอ่านชื่อ บริษัท ตำแหน่ง เบอร์โทร LINE และอีเมลให้อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 px-5 pt-2 gap-2 bg-slate-950/40">
          <button
            onClick={() => {
              setActiveTab('camera');
              setPreviewImage(null);
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'camera'
                ? 'text-indigo-400 border-indigo-500 bg-slate-800/60'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            กล้องถ่ายรูป
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'upload'
                ? 'text-indigo-400 border-indigo-500 bg-slate-800/60'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            อัปโหลดรูปภาพ
          </button>

          <button
            onClick={() => {
              setActiveTab('sample');
              stopCamera();
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'sample'
                ? 'text-indigo-400 border-indigo-500 bg-slate-800/60'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ทดสอบด้วยนามบัตรตัวอย่าง
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[320px]">
          
          {/* Scanning Overlay Spinner */}
          {isScanning && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500 border-t-cyan-400 animate-spin flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">AI กำลังวิเคราะห์นามบัตร</h3>
                <p className="text-sm text-cyan-300 font-medium">{scanStep}</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  ระบบกำลังตรวจหาข้อมูลสำคัญเพื่อบันทึกลงฐานข้อมูลและสร้างปุ่มโทรออก อีเมล และ LINE ให้พร้อมใช้งาน
                </p>
              </div>
              {previewImage && (
                <div className="w-48 h-28 rounded-lg overflow-hidden border border-slate-700 shadow-md opacity-80 mt-2">
                  <img src={previewImage} alt="Scanning" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {!isScanning && errorMsg && (
            <div className="w-full mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: CAMERA */}
          {!isScanning && activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center">
              {cameraError ? (
                <div className="text-center p-6 bg-slate-800/40 rounded-2xl border border-slate-800 max-w-md">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-200 mb-2 font-medium">ไม่สามารถเปิดกล้องได้</p>
                  <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่อีกครั้ง
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-3.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> อัปโหลดรูปแทน
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  {/* Viewfinder with aspect ratio of a business card */}
                  <div className="relative w-full max-w-lg aspect-[16/10] bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Business card framing guide */}
                    <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-cyan-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between text-[11px] font-medium text-cyan-300 drop-shadow">
                        <span>┌ วางนามบัตรในกรอบนี้</span>
                        <span>┐</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-medium text-cyan-300 drop-shadow">
                        <span>└ ให้เห็นตัวอักษรชัดเจน</span>
                        <span>┘</span>
                      </div>
                    </div>

                    {/* Camera switch button */}
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      title="สลับกล้องหน้า/หลัง"
                      className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full backdrop-blur-sm border border-slate-700 transition"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Shutter Button */}
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <button
                      onClick={capturePhoto}
                      disabled={!cameraActive}
                      className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-full shadow-lg shadow-indigo-600/30 active:scale-95 transition disabled:opacity-50"
                    >
                      <div className="w-4 h-4 rounded-full bg-white animate-ping" />
                      <span>กดถ่ายรูปเพื่อสแกน</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {!isScanning && activeTab === 'upload' && (
            <div className="w-full flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 transition group text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600/30 flex items-center justify-center mb-3 transition">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-slate-200 mb-1">
                  คลิกเพื่อเลือกรูปภาพนามบัตร หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs text-slate-400">
                  รองรับไฟล์ JPG, PNG, WEBP, HEIC (แนะนำความละเอียดชัดเจน)
                </p>
              </div>

              {previewImage && (
                <div className="mt-4 flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  <img src={previewImage} alt="Selected" className="w-16 h-10 object-cover rounded-md" />
                  <div className="text-left text-xs">
                    <p className="font-semibold text-white">รูปภาพพร้อมวิเคราะห์</p>
                    <p className="text-slate-400">คลิกปุ่มด้านล่างเพื่อเริ่มอ่านข้อมูล</p>
                  </div>
                  <button
                    onClick={() => processImageWithAI(previewImage)}
                    className="ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    สแกนด้วย AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAMPLE CARDS */}
          {!isScanning && activeTab === 'sample' && (
            <div className="w-full">
              <div className="text-center mb-4">
                <p className="text-xs text-slate-400">
                  ไม่มีนามบัตรจริงอยู่ใกล้ตัว? เลือกลองทดสอบระบบ AI Vision ด้วยนามบัตรจำลอง 3 รูปแบบนี้ได้ทันที:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_CARD_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectSample(preset)}
                    className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/80 rounded-xl p-3 cursor-pointer transition transform hover:-translate-y-1 shadow-md flex flex-col justify-between"
                  >
                    <div className="w-full aspect-[16/10] rounded-lg overflow-hidden border border-slate-700/60 mb-2.5 relative">
                      <img
                        src={preset.svgDataUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-[11px] font-bold text-white bg-indigo-600 px-2 py-1 rounded-md shadow">
                          คลิกเพื่อทดสอบ
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 line-clamp-1">
                        {preset.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{preset.subtitle}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {preset.colorScheme}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-between items-center text-xs text-slate-400">
          <span>AI จะสกัด: ชื่อ, บริษัท, ตำแหน่ง, เบอร์โทร, อีเมล, LINE ID</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
