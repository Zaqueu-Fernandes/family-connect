import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, X } from "lucide-react";

interface AudioRecorderProps {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        setRecorded(blob);
        setFinalDuration(duration);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecorded(null);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      console.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSend = () => {
    if (recorded) {
      onRecorded(recorded);
      setRecorded(null);
      setFinalDuration(0);
    }
  };

  const handleDiscard = () => {
    setRecorded(null);
    setFinalDuration(0);
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (recorded) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 text-muted-foreground" onClick={handleDiscard}>
          <X className="h-5 w-5" />
        </Button>
        <span className="text-sm font-mono text-muted-foreground">{formatDuration(finalDuration)}</span>
        <div className="flex-1" />
        <Button size="icon" className="rounded-full h-10 w-10" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-mono text-destructive">{formatDuration(duration)}</span>
        <div className="flex-1" />
        <Button
          size="icon"
          variant="destructive"
          className="rounded-full h-10 w-10"
          onClick={stopRecording}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="rounded-full h-10 w-10 text-muted-foreground"
      onClick={startRecording}
      disabled={disabled}
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
