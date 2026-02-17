import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttachmentPickerProps {
  onFileSelected: (file: File, type: "image" | "file") => void;
  disabled?: boolean;
}

export default function AttachmentPicker({ onFileSelected, disabled }: AttachmentPickerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file, "file");
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-10 w-10 text-muted-foreground"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="min-w-[160px]">
          <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
            <Image className="mr-2 h-4 w-4 text-primary" />
            Foto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <FileText className="mr-2 h-4 w-4 text-primary" />
            Arquivo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
