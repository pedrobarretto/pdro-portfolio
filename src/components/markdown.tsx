import { cn } from "@/lib/utils";
import { markdownToHtml } from "@/lib/markdown";

export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const html = markdownToHtml(content);

  return (
    <div
      className={cn("markdown", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
