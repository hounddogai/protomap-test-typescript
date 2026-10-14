import * as text from "../../../../kit/text.js";
import { TieredWarmupBatch } from "./tiered-warmup-batch.js";

/** How screens and exports show a tiered warmup batch. */
export class TieredWarmupBatchView {
  codeText: string;
  title: string;
  archived: string;
  budget: string;
  currencyText: string;
  audienceId: string;
  summary: string;
  unit: string;
  expiresAtText: string;
  country: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    archived: string,
    budget: string,
    currencyText: string,
    audienceId: string,
    summary: string,
    unit: string,
    expiresAtText: string,
    country: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.archived = archived;
    this.budget = budget;
    this.currencyText = currencyText;
    this.audienceId = audienceId;
    this.summary = summary;
    this.unit = unit;
    this.expiresAtText = expiresAtText;
    this.country = country;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWarmupBatchView(item: TieredWarmupBatch): TieredWarmupBatchView {
  return new TieredWarmupBatchView(
    item.code,
    text.truncate(item.title, 40),
    `${item.archived}`,
    item.budget.toFixed(2),
    item.currency,
    item.audienceId,
    item.summary,
    item.unit,
    String(item.expiresAt),
    item.country,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWarmupBatchViews(items: TieredWarmupBatch[]): TieredWarmupBatchView[] {
  const views: TieredWarmupBatchView[] = [];
  for (const item of items) {
    views.push(toTieredWarmupBatchView(item));
  }
  return views;
}

export function sumTieredWarmupBatchView(view: TieredWarmupBatchView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedBudget + parsedExpiresAt;
}
