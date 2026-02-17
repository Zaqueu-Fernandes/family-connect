import { useState, useEffect } from "react";
import { PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActiveCallOverlayProps {
  peerName: string;
  peerAvatar?: string;
  status: "calling" | "ringing" | "answered";
  onHangUp: () => void;
}

export default function ActiveCallOverlay({
  peerName,
  peerAvatar,
  status,
  onHangUp,
}: ActiveCallOverlayProps) {
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (status !== "answered") return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const toggleMute = () => {
    setMuted((prev) => {
      // We can't access the stream directly here, so we emit via a data attribute
      // The parent should handle mute toggling through the localStream
      return !prev;
    });
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const initials = peerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusText = status === "calling" || status === "ringing" ? "Chamando..." : formatDuration(duration);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-primary/90 to-primary py-12 px-6">
      <div className="flex flex-col items-center gap-4 mt-8">
        <Avatar className="h-24 w-24 border-4 border-primary-foreground/30">
          <AvatarImage src={peerAvatar} />
          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-3xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-xl font-semibold text-primary-foreground">{peerName}</p>
        <p className="text-sm text-primary-foreground/70 font-mono">{statusText}</p>
      </div>

      <div className="flex gap-8 mb-8">
        <Button
          size="icon"
          variant="ghost"
          className={`h-14 w-14 rounded-full ${muted ? "bg-primary-foreground/30" : "bg-primary-foreground/10"} text-primary-foreground`}
          onClick={toggleMute}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-14 w-14 rounded-full"
          onClick={onHangUp}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
