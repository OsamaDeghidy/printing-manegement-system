"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label?: string;
  description?: string;
  onFilesChange?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
}

export function FileUpload({
  label,
  description,
  multiple = true,
  accept,
  onFilesChange,
}: FileUploadProps) {
  const [hovered, setHovered] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFiles = useCallback(
    (filesList: FileList | null) => {
      if (!filesList) return;

      const files = Array.from(filesList);
      setSelectedFiles(files);
      onFilesChange?.(files);
    },
    [onFilesChange]
  );

  return (
    <div className="space-y-3">
      {label ? <p className="text-sm font-medium text-heading">{label}</p> : null}
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setHovered(true);
        }}
        onDragLeave={() => setHovered(false)}
        onDrop={(event) => {
          event.preventDefault();
          setHovered(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition",
          hovered && "border-brand-teal bg-brand-teal/5"
        )}
      >
        <span className="text-2xl">📁</span>
        <p className="text-sm font-semibold text-heading">
          اسحب الملفات هنا أو اضغط للاختيار
        </p>
        <p className="text-xs text-muted">
          {description ??
            "يدعم الملفات PDF، DOCX، الصور، بحد أقصى 50 ميجابايت لكل ملف"}
        </p>
        <input
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </label>
      {selectedFiles.length ? (
        <ul className="space-y-2 text-sm text-muted">
          {selectedFiles.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between rounded-md bg-surface-muted px-4 py-2"
            >
              <span className="truncate">{file.name}</span>
              <span>{Math.round(file.size / 1024)} كيلوبايت</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}


