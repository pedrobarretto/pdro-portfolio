import fs from "node:fs";
import path from "node:path";
import { markdownToHtml } from "@/lib/markdown";

const THOUGHTS_DIR = path.join(process.cwd(), "content", "thoughts");
const WORDS_PER_MINUTE = 200;

export type Thought = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTimeMinutes: number;
  readingTimeText: string;
  draft: boolean;
};

export type ThoughtWithContent = Thought & {
  content: string;
  html: string;
};

type FrontMatter = {
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
};

function isDirectoryMissing() {
  return !fs.existsSync(THOUGHTS_DIR);
}

function getThoughtFileNames() {
  if (isDirectoryMissing()) return [];
  return fs
    .readdirSync(THOUGHTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !file.startsWith("."));
}

function parseFrontMatter(raw: string): { data: FrontMatter; content: string } {
  if (!raw.startsWith("---")) {
    return { data: {}, content: raw.trim() };
  }

  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    return { data: {}, content: raw.trim() };
  }

  const frontMatterText = match[1];
  const content = raw.slice(match[0].length).trim();
  const data: FrontMatter = {};
  const lines = frontMatterText.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;

    const key = keyMatch[1];
    const rawValue = keyMatch[2].trim();

    if (rawValue === "" && i + 1 < lines.length) {
      const listItems: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith("- ")) {
        listItems.push(lines[j].trim().slice(2));
        j += 1;
      }
      if (listItems.length > 0) {
        data[key as keyof FrontMatter] = listItems as never;
        i = j - 1;
        continue;
      }
    }

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const items = rawValue
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      data[key as keyof FrontMatter] = items as never;
      continue;
    }

    if (rawValue === "true" || rawValue === "false") {
      data[key as keyof FrontMatter] = (rawValue === "true") as never;
      continue;
    }

    const unquoted = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    data[key as keyof FrontMatter] = unquoted as never;
  }

  return { data, content };
}

function estimateReadingTime(text: string) {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~`-]/g, " ");

  const words = cleaned.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));

  return {
    minutes,
    text: `${minutes} min read`,
  };
}

function formatSlug(fileName: string) {
  return fileName.replace(/\.md$/, "");
}

function normalizeTags(tags?: string[]) {
  if (!tags) return [];
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function isPublished(thought: Thought) {
  if (!thought.draft) return true;
  return process.env.NODE_ENV !== "production";
}

export function formatThoughtDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function getThoughtBySlug(slug: string): ThoughtWithContent | null {
  const safeSlug = slug.replace(/\.\./g, "").replace(/[\\/]/g, "");
  const fullPath = path.join(THOUGHTS_DIR, `${safeSlug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = parseFrontMatter(raw);

  if (!data.title || !data.description || !data.date) {
    throw new Error(`Missing required front matter in ${fullPath}`);
  }

  const readingTime = estimateReadingTime(content);
  const thought: Thought = {
    slug: safeSlug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: normalizeTags(data.tags),
    readingTimeMinutes: readingTime.minutes,
    readingTimeText: readingTime.text,
    draft: Boolean(data.draft),
  };

  const html = markdownToHtml(content);

  return {
    ...thought,
    content,
    html,
  };
}

export function getAllThoughts(): Thought[] {
  const files = getThoughtFileNames();
  const thoughts = files
    .map((file) => {
      const slug = formatSlug(file);
      const thought = getThoughtBySlug(slug);
      return thought;
    })
    .filter((thought): thought is ThoughtWithContent => Boolean(thought))
    .map((thought) => {
      const { html: _html, content: _content, ...rest } = thought;
      return rest;
    })
    .filter(isPublished)
    .sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });

  return thoughts;
}
