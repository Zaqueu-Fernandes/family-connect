import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

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
      <img src={logo} alt="WhatsZak" className="h-28 w-28 rounded-2xl mb-6" />
      <h1 className="text-4xl font-bold text-primary-foreground">WhatsZak</h1>
      <p className="mt-2 text-primary-foreground/70 text-sm">Chat familiar seguro</p>
    </div>
  );
}
