import { RetentionDraft } from "./retention-draft.js";

/** How screens and exports show a retention draft. */
export class RetentionDraftView {
  code: string;
  label: string;
  capacity: string;
  discountText: string;
  archivedText: string;
  category: string;
  clicks: string;
  score: string;
  locale: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacity: string,
    discountText: string,
    archivedText: string,
    category: string,
    clicks: string,
    score: string,
    locale: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.discountText = discountText;
    this.archivedText = archivedText;
    this.category = category;
    this.clicks = clicks;
    this.score = score;
    this.locale = locale;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionDraftView(item: RetentionDraft): RetentionDraftView {
  return new RetentionDraftView(
    item.code,
    item.label,
    String(item.capacity),
    item.discount.toFixed(2),
    `${item.archived}`,
    item.category,
    String(item.clicks),
    item.score.toFixed(2),
    item.locale,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionDraftViews(items: RetentionDraft[]): RetentionDraftView[] {
  const views: RetentionDraftView[] = [];
  for (const item of items) {
    views.push(toRetentionDraftView(item));
  }
  return views;
}

export function sumRetentionDraftView(view: RetentionDraftView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedCapacity + parsedDiscount + parsedClicks;
}
