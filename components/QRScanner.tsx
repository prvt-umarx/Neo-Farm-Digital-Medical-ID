
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  lang: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number | null>(null);

  const startCamera = async () => {
    setError(null);

    // Check if the context is secure (getUserMedia requires HTTPS or localhost)
    if (!window.isSecureContext) {
      setError(lang === 'ru' 
        ? 'Требуется безопасное соединение (HTTPS) для доступа к камере.' 
        : 'Kameraga kirish uchun xavfsiz ulanish (HTTPS) talab qilinadi.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(lang === 'ru'
        ? 'Ваш браузер не поддерживает доступ к камере.'
        : 'Sizning brauzeringiz kameraga kirishni qo\'llab-quvvatlamaydi.');
      return;
    }

    try {
      let stream: MediaStream;
      
      try {
        // Attempt to get the back camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } }
        });
      } catch (e) {
        console.warn("Could not access environment camera with 'exact' constraint, falling back to 'ideal'", e);
        try {
          // Fallback: request environment camera as preferred but not required
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
        } catch (e2) {
          console.warn("Could not access environment camera, falling back to any video device", e2);
          // Ultimate fallback: any video device
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      
      let errorMsg = lang === 'ru' ? 'Ошибка доступа к камере' : 'Kameraga kirishda xatolik';
      
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = lang === 'ru' 
          ? 'Камера не обнаружена. Пожалуйста, убедитесь, что камера подключена и не используется другим приложением.' 
          : 'Kamera topilmadi. Iltimos, kamera ulanganligini va boshqa dastur tomonidan ishlatilmayotganligini tekshiring.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = lang === 'ru'
          ? 'Доступ к камере отклонен. Пожалуйста, разрешите доступ в настройках браузера и обновите страницу.'
          : 'Kameraga kirish rad etildi. Iltimos, brauzer sozlamalarida ruxsat bering va sahifani yangilang.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = lang === 'ru'
          ? 'Камера уже используется другим приложением или вкладкой.'
          : 'Kamera allaqachon boshqa dastur yoki sahifa tomonidan ishlatilmoqda.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = lang === 'ru'
          ? 'Требуемые параметры камеры не поддерживаются вашим устройством.'
          : 'Kamera uchun talab qilingan parametrlar qurilmangiz tomonidan qo\'llab-quvvatlanmaydi.';
      }
      
      setError(errorMsg);
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code) {
            onScan(code.data);
            return;
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-2xl shadow-emerald-500/20">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <p className="font-bold text-lg mb-2">{lang === 'ru' ? 'Ошибка' : 'Xatolik'}</p>
            <p className="text-slate-300 text-sm mb-6">{error}</p>
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={startCamera}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg"
              >
                {lang === 'ru' ? 'Попробовать снова' : 'Qayta urinish'}
              </button>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all border border-white/10"
              >
                {lang === 'ru' ? 'Закрыть' : 'Yopish'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="scanner-laser"></div>
              <div className="absolute inset-10 border-2 border-emerald-500/30 rounded-2xl"></div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                  {lang === 'ru' ? 'Сканирование...' : 'Skanerlanmoqda...'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {!error && (
        <div className="mt-8 text-center text-white">
          <p className="text-lg font-medium mb-6 px-4">
            {lang === 'ru' ? 'Наведите камеру на QR-код пациента' : 'Kamerani bemorning QR-kodiga qarating'}
          </p>
          <button 
            onClick={onClose}
            className="w-16 h-16 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-2xl transition-all border border-white/10"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
