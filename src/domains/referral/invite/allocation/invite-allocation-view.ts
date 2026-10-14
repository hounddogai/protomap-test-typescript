import { InviteAllocation } from "./invite-allocation.js";

/** How screens and exports show a invite allocation. */
export class InviteAllocationView {
  codeText: string;
  label: string;
  pinned: string;
  description: string;
  retriesText: string;
  category: string;
  durationMinutes: string;
  score: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    pinned: string,
    description: string,
    retriesText: string,
    category: string,
    durationMinutes: string,
    score: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.pinned = pinned;
    this.description = description;
    this.retriesText = retriesText;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toInviteAllocationView(item: InviteAllocation): InviteAllocationView {
  return new InviteAllocationView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.description,
    String(item.retries),
    item.category,
    String(item.durationMinutes),
    item.score.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteAllocationViews(items: InviteAllocation[]): InviteAllocationView[] {
  const views: InviteAllocationView[] = [];
  for (const item of items) {
    views.push(toInviteAllocationView(item));
  }
  return views;
}

export function sumInviteAllocationView(view: InviteAllocationView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedRetries + parsedDurationMinutes + parsedScore;
}
