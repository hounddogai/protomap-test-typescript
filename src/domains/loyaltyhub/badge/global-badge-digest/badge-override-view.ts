import { BadgeOverride } from "./badge-override.js";

/** How screens and exports show a badge override. */
export class BadgeOverrideView {
  code: string;
  title: string;
  approved: string;
  channelText: string;
  batchSize: string;
  durationMinutes: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approved: string,
    channelText: string,
    batchSize: string,
    durationMinutes: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.channelText = channelText;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeOverrideView(item: BadgeOverride): BadgeOverrideView {
  return new BadgeOverrideView(
    item.code,
    item.title,
    `${item.approved}`,
    item.channel,
    String(item.batchSize),
    String(item.durationMinutes),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeOverrideViews(items: BadgeOverride[]): BadgeOverrideView[] {
  const views: BadgeOverrideView[] = [];
  for (const item of items) {
    views.push(toBadgeOverrideView(item));
  }
  return views;
}

export function sumBadgeOverrideView(view: BadgeOverrideView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedBatchSize + parsedDurationMinutes + parsedAttempts;
}
