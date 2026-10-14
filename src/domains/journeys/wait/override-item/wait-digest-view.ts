import { WaitDigest } from "./wait-digest.js";

/** How screens and exports show a wait digest. */
export class WaitDigestView {
  codeText: string;
  name: string;
  durationMinutes: string;
  reviewerText: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    durationMinutes: string,
    reviewerText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.reviewerText = reviewerText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toWaitDigestView(item: WaitDigest): WaitDigestView {
  return new WaitDigestView(
    item.code,
    item.name,
    String(item.durationMinutes),
    item.reviewer,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitDigestViews(items: WaitDigest[]): WaitDigestView[] {
  const views: WaitDigestView[] = [];
  for (const item of items) {
    views.push(toWaitDigestView(item));
  }
  return views;
}

export function sumWaitDigestView(view: WaitDigestView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
