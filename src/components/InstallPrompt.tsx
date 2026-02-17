import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in">
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground shadow-lg">
        <Download className="h-6 w-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instalar WhatsZak</p>
          <p className="text-xs opacity-90">
            {isIOS
              ? "Toque em Compartilhar → Adicionar à Tela de Início"
              : "Adicione à tela inicial para acesso rápido"}
          </p>
        </div>
        {!isIOS && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="shrink-0"
          >
            Instalar
          </Button>
        )}
        <button onClick={handleDismiss} className="shrink-0 opacity-70 hover:opacity-100">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
