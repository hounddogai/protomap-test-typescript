import { BadgeDraft } from "./badge-draft.js";

/** How screens and exports show a badge draft. */
export class BadgeDraftView {
  code: string;
  title: string;
  weight: string;
  expiresAt: string;
  limit: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    weight: string,
    expiresAt: string,
    limit: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.limit = limit;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeDraftView(item: BadgeDraft): BadgeDraftView {
  return new BadgeDraftView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    String(item.expiresAt),
    String(item.limit),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeDraftViews(items: BadgeDraft[]): BadgeDraftView[] {
  const views: BadgeDraftView[] = [];
  for (const item of items) {
    views.push(toBadgeDraftView(item));
  }
  return views;
}

export function sumBadgeDraftView(view: BadgeDraftView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedWeight + parsedExpiresAt + parsedLimit;
}
