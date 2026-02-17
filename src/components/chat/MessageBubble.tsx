import { useState } from "react";
import { format } from "date-fns";
import { FileText, Download, Reply, Trash2, Share2, Forward, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReplyInfo {
  id: string;
  content: string | null;
  messageType: string;
  senderName: string;
}

interface MessageBubbleProps {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  messageType: string;
  isMine: boolean;
  createdAt: string;
  deleted: boolean;
  replyTo?: ReplyInfo | null;
  onReply: (id: string) => void;
  onDeleteForMe: (id: string) => void;
  onDeleteForAll: (id: string) => void;
  onForward: (id: string) => void;
  onShare: (id: string) => void;
}

export default function MessageBubble({
  id,
  content,
  mediaUrl,
  messageType,
  isMine,
  createdAt,
  deleted,
  replyTo,
  onReply,
  onDeleteForMe,
  onDeleteForAll,
  onForward,
  onShare,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
            isMine
              ? "bg-chat-bubble-sent rounded-tr-none"
              : "bg-chat-bubble-received rounded-tl-none"
          } opacity-60`}
        >
          <p className="text-sm italic text-muted-foreground">🚫 Mensagem apagada</p>
          <p className="text-[10px] mt-1 text-right text-muted-foreground">
            {format(new Date(createdAt), "HH:mm")}
          </p>
        </div>
      </div>
    );
  }

  const renderReplyPreview = () => {
    if (!replyTo) return null;
    const previewText =
      replyTo.messageType === "audio"
        ? "🎵 Áudio"
        : replyTo.messageType === "image"
        ? "📷 Imagem"
        : replyTo.messageType === "file"
        ? "📎 Arquivo"
        : replyTo.content ?? "";

    return (
      <div className="border-l-2 border-primary pl-2 mb-1 rounded bg-background/30 py-1 px-2">
        <p className="text-[11px] font-semibold text-primary">{replyTo.senderName}</p>
        <p className="text-[11px] text-muted-foreground truncate">{previewText}</p>
      </div>
    );
  };

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

  const handleLongPress = () => setShowMenu(true);

  const handleAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} relative`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
          isMine
            ? "bg-chat-bubble-sent rounded-tr-none"
            : "bg-chat-bubble-received rounded-tl-none"
        }`}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(true);
        }}
        onClick={() => {
          // On mobile, single tap can also toggle for convenience
        }}
        onTouchStart={() => {
          const timer = setTimeout(() => setShowMenu(true), 500);
          const clearTimer = () => clearTimeout(timer);
          document.addEventListener("touchend", clearTimer, { once: true });
          document.addEventListener("touchmove", clearTimer, { once: true });
        }}
      >
        {renderReplyPreview()}
        {renderContent()}
        <p className="text-[10px] mt-1 text-right text-muted-foreground">
          {format(new Date(createdAt), "HH:mm")}
        </p>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            className={`absolute z-50 ${isMine ? "right-0" : "left-0"} bottom-full mb-1 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px]`}
          >
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
              onClick={() => handleAction(() => onReply(id))}
            >
              <Reply className="h-4 w-4" /> Responder
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
              onClick={() => handleAction(() => onForward(id))}
            >
              <Forward className="h-4 w-4" /> Encaminhar
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
              onClick={() => handleAction(() => onShare(id))}
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            <div className="border-t border-border my-1" />
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
              onClick={() => handleAction(() => onDeleteForMe(id))}
            >
              <Trash2 className="h-4 w-4" /> Apagar para mim
            </button>
            {isMine && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive/10 transition-colors text-destructive"
                onClick={() => handleAction(() => onDeleteForAll(id))}
              >
                <Trash2 className="h-4 w-4" /> Apagar para todos
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
