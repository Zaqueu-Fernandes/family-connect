import { Phone, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CallMode } from "@/hooks/use-webrtc";
import { useRingtone } from "@/hooks/use-ringtone";

interface IncomingCallDialogProps {
  callerName: string;
  callerAvatar?: string;
  onAccept: (mode: CallMode) => void;
  onReject: () => void;
}

export default function IncomingCallDialog({
  callerName,
  callerAvatar,
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  // Play incoming ringtone while dialog is shown
  useRingtone(true, "incoming");

  const initials = callerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card text-card-foreground shadow-xl max-w-xs w-full mx-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={callerAvatar} />
          <AvatarFallback className="bg-primary/20 text-primary text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="text-center">
          <p className="text-lg font-semibold">{callerName}</p>
          <p className="text-sm text-muted-foreground animate-pulse">Chamada recebida...</p>
        </div>

        <div className="flex gap-6">
          <Button
            size="icon"
            variant="destructive"
            className="h-14 w-14 rounded-full"
            onClick={onReject}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
            onClick={() => onAccept("audio")}
          >
            <Phone className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
            onClick={() => onAccept("video")}
          >
            <Video className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
