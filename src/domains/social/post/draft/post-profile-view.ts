import { PostProfile } from "./post-profile.js";

/** How screens and exports show a post profile. */
export class PostProfileView {
  codeText: string;
  label: string;
  pinned: string;
  minimumText: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    pinned: string,
    minimumText: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.pinned = pinned;
    this.minimumText = minimumText;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toPostProfileView(item: PostProfile): PostProfileView {
  return new PostProfileView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.minimum.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostProfileViews(items: PostProfile[]): PostProfileView[] {
  const views: PostProfileView[] = [];
  for (const item of items) {
    views.push(toPostProfileView(item));
  }
  return views;
}

export function sumPostProfileView(view: PostProfileView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedMinimum + parsedAttempts;
}
