import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1500);
    const finishTimer = setTimeout(onFinish, 2000);
    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-foreground/20 mb-6">
        <MessageCircle className="h-14 w-14 text-primary-foreground" />
      </div>
      <h1 className="text-4xl font-bold text-primary-foreground">WhatsZak</h1>
      <p className="mt-2 text-primary-foreground/70 text-sm">Chat familiar seguro</p>
    </div>
  );
}
