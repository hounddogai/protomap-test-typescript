import { MentionTemplate } from "./mention-template.js";

/** How screens and exports show a mention template. */
export class MentionTemplateView {
  code: string;
  name: string;
  clicks: string;
  expiresAt: string;
  statusLabel: string;

  constructor(code: string, name: string, clicks: string, expiresAt: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toMentionTemplateView(item: MentionTemplate): MentionTemplateView {
  return new MentionTemplateView(
    item.code,
    item.name,
    String(item.clicks),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionTemplateViews(items: MentionTemplate[]): MentionTemplateView[] {
  const views: MentionTemplateView[] = [];
  for (const item of items) {
    views.push(toMentionTemplateView(item));
  }
  return views;
}

export function sumMentionTemplateView(view: MentionTemplateView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedClicks + parsedExpiresAt;
}
