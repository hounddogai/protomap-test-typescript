import { BadgeBatch } from "./badge-batch.js";

/** How screens and exports show a badge batch. */
export class BadgeBatchView {
  code: string;
  name: string;
  updatedAt: string;
  attempts: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    attempts: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeBatchView(item: BadgeBatch): BadgeBatchView {
  return new BadgeBatchView(
    item.code,
    item.name,
    String(item.updatedAt),
    String(item.attempts),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeBatchViews(items: BadgeBatch[]): BadgeBatchView[] {
  const views: BadgeBatchView[] = [];
  for (const item of items) {
    views.push(toBadgeBatchView(item));
  }
  return views;
}

export function sumBadgeBatchView(view: BadgeBatchView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedUpdatedAt + parsedAttempts;
}
