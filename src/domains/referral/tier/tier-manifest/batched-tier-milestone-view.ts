import * as text from "../../../../kit/text.js";
import { BatchedTierMilestone } from "./batched-tier-milestone.js";

/** How screens and exports show a batched tier milestone. */
export class BatchedTierMilestoneView {
  code: string;
  title: string;
  impressions: string;
  sendAt: string;
  ownerIdText: string;
  discount: string;
  budget: string;
  updatedAt: string;
  description: string;
  summary: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    impressions: string,
    sendAt: string,
    ownerIdText: string,
    discount: string,
    budget: string,
    updatedAt: string,
    description: string,
    summary: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.ownerIdText = ownerIdText;
    this.discount = discount;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.description = description;
    this.summary = summary;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedTierMilestoneView(item: BatchedTierMilestone): BatchedTierMilestoneView {
  return new BatchedTierMilestoneView(
    text.truncate(item.code, 80),
    item.title,
    String(item.impressions),
    String(item.sendAt),
    item.ownerId,
    item.discount.toFixed(2),
    item.budget.toFixed(2),
    String(item.updatedAt),
    item.description,
    item.summary,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedTierMilestoneViews(items: BatchedTierMilestone[]): BatchedTierMilestoneView[] {
  const views: BatchedTierMilestoneView[] = [];
  for (const item of items) {
    views.push(toBatchedTierMilestoneView(item));
  }
  return views;
}

export function sumBatchedTierMilestoneView(view: BatchedTierMilestoneView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedImpressions + parsedSendAt + parsedDiscount;
}
