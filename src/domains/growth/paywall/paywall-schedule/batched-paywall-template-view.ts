import * as text from "../../../../kit/text.js";
import { BatchedPaywallTemplate } from "./batched-paywall-template.js";

/** How screens and exports show a batched paywall template. */
export class BatchedPaywallTemplateView {
  code: string;
  title: string;
  graceDays: string;
  expiresAt: string;
  createdAt: string;
  ratio: string;
  limit: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    expiresAt: string,
    createdAt: string,
    ratio: string,
    limit: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.ratio = ratio;
    this.limit = limit;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPaywallTemplateView(item: BatchedPaywallTemplate): BatchedPaywallTemplateView {
  return new BatchedPaywallTemplateView(
    text.truncate(item.code, 40),
    item.title,
    String(item.graceDays),
    String(item.expiresAt),
    String(item.createdAt),
    item.ratio.toFixed(2),
    String(item.limit),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPaywallTemplateViews(items: BatchedPaywallTemplate[]): BatchedPaywallTemplateView[] {
  const views: BatchedPaywallTemplateView[] = [];
  for (const item of items) {
    views.push(toBatchedPaywallTemplateView(item));
  }
  return views;
}

export function sumBatchedPaywallTemplateView(view: BatchedPaywallTemplateView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedGraceDays + parsedExpiresAt + parsedCreatedAt;
}
