import * as text from "../../../../kit/text.js";
import { LenientRewardAudit } from "./lenient-reward-audit.js";

/** How screens and exports show a lenient reward audit. */
export class LenientRewardAuditView {
  code: string;
  nameText: string;
  region: string;
  campaignRef: string;
  capacity: string;
  approved: string;
  scoreText: string;
  quantityText: string;
  windowDays: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    region: string,
    campaignRef: string,
    capacity: string,
    approved: string,
    scoreText: string,
    quantityText: string,
    windowDays: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.region = region;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.approved = approved;
    this.scoreText = scoreText;
    this.quantityText = quantityText;
    this.windowDays = windowDays;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRewardAuditView(item: LenientRewardAudit): LenientRewardAuditView {
  return new LenientRewardAuditView(
    item.code,
    item.name,
    item.region,
    text.truncate(item.campaignRef, 120),
    String(item.capacity),
    `${item.approved}`,
    item.score.toFixed(2),
    String(item.quantity),
    String(item.windowDays),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRewardAuditViews(items: LenientRewardAudit[]): LenientRewardAuditView[] {
  const views: LenientRewardAuditView[] = [];
  for (const item of items) {
    views.push(toLenientRewardAuditView(item));
  }
  return views;
}

export function sumLenientRewardAuditView(view: LenientRewardAuditView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedCapacity + parsedScore + parsedQuantity;
}
