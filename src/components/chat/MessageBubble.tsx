import { format } from "date-fns";
import { FileText, Download } from "lucide-react";

interface MessageBubbleProps {
  content: string | null;
  mediaUrl: string | null;
  messageType: string;
  isMine: boolean;
  createdAt: string;
}

export default function MessageBubble({
  content,
  mediaUrl,
  messageType,
  isMine,
  createdAt,
}: MessageBubbleProps) {
  const renderContent = () => {
    switch (messageType) {
      case "image":
        return (
          <div>
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt="Imagem"
                className="max-w-full rounded-md mb-1 cursor-pointer"
                onClick={() => window.open(mediaUrl, "_blank")}
              />
            )}
            {content && <p className="text-sm break-words">{content}</p>}
          </div>
        );
      case "audio":
        return (
          <div className="min-w-[200px]">
            {mediaUrl && (
              <audio controls className="w-full max-w-[250px]" preload="metadata">
                <source src={mediaUrl} type="audio/webm" />
              </audio>
            )}
          </div>
        );
      case "file":
        return (
          <a
            href={mediaUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
          >
            <FileText className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{content ?? "Arquivo"}</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground shrink-0" />
          </a>
        );
      default:
        return <p className="text-sm break-words">{content}</p>;
    }
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
          isMine
            ? "bg-chat-bubble-sent rounded-tr-none"
            : "bg-chat-bubble-received rounded-tl-none"
        }`}
      >
        {renderContent()}
        <p className="text-[10px] mt-1 text-right text-muted-foreground">
          {format(new Date(createdAt), "HH:mm")}
        </p>
      </div>
    </div>
  );
}
