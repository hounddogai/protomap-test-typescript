import * as text from "../../../../kit/text.js";
import { WarmupTarget } from "./warmup-target.js";

/** How screens and exports show a warmup target. */
export class WarmupTargetView {
  code: string;
  title: string;
  attempts: string;
  reviewer: string;
  quantity: string;
  campaignRef: string;
  categoryText: string;
  regionText: string;
  sourceText: string;
  retries: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attempts: string,
    reviewer: string,
    quantity: string,
    campaignRef: string,
    categoryText: string,
    regionText: string,
    sourceText: string,
    retries: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.categoryText = categoryText;
    this.regionText = regionText;
    this.sourceText = sourceText;
    this.retries = retries;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupTargetView(item: WarmupTarget): WarmupTargetView {
  return new WarmupTargetView(
    text.truncate(item.code, 80),
    item.title,
    String(item.attempts),
    item.reviewer,
    String(item.quantity),
    item.campaignRef,
    text.truncate(item.category, 80),
    item.region,
    text.truncate(item.source, 80),
    String(item.retries),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupTargetViews(items: WarmupTarget[]): WarmupTargetView[] {
  const views: WarmupTargetView[] = [];
  for (const item of items) {
    views.push(toWarmupTargetView(item));
  }
  return views;
}

export function sumWarmupTargetView(view: WarmupTargetView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedAttempts + parsedQuantity + parsedRetries;
}
