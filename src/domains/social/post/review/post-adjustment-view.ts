import * as text from "../../../../kit/text.js";
import { PostAdjustment } from "./post-adjustment.js";

/** How screens and exports show a post adjustment. */
export class PostAdjustmentView {
  code: string;
  titleText: string;
  utmSource: string;
  notes: string;
  pinned: string;
  attempts: string;
  labelText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    utmSource: string,
    notes: string,
    pinned: string,
    attempts: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.utmSource = utmSource;
    this.notes = notes;
    this.pinned = pinned;
    this.attempts = attempts;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toPostAdjustmentView(item: PostAdjustment): PostAdjustmentView {
  return new PostAdjustmentView(
    item.code,
    item.title,
    text.truncate(item.utmSource, 120),
    item.notes,
    `${item.pinned}`,
    String(item.attempts),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostAdjustmentViews(items: PostAdjustment[]): PostAdjustmentView[] {
  const views: PostAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPostAdjustmentView(item));
  }
  return views;
}

export function sumPostAdjustmentView(view: PostAdjustmentView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
