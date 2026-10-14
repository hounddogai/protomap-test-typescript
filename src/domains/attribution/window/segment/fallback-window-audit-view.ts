import * as text from "../../../../kit/text.js";
import { FallbackWindowAudit } from "./fallback-window-audit.js";

/** How screens and exports show a fallback window audit. */
export class FallbackWindowAuditView {
  codeText: string;
  name: string;
  ratioText: string;
  createdAtText: string;
  channelText: string;
  reviewer: string;
  budget: string;
  discount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ratioText: string,
    createdAtText: string,
    channelText: string,
    reviewer: string,
    budget: string,
    discount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ratioText = ratioText;
    this.createdAtText = createdAtText;
    this.channelText = channelText;
    this.reviewer = reviewer;
    this.budget = budget;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackWindowAuditView(item: FallbackWindowAudit): FallbackWindowAuditView {
  return new FallbackWindowAuditView(
    text.truncate(item.code, 40),
    item.name,
    item.ratio.toFixed(2),
    String(item.createdAt),
    item.channel,
    item.reviewer,
    item.budget.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackWindowAuditViews(items: FallbackWindowAudit[]): FallbackWindowAuditView[] {
  const views: FallbackWindowAuditView[] = [];
  for (const item of items) {
    views.push(toFallbackWindowAuditView(item));
  }
  return views;
}

export function sumFallbackWindowAuditView(view: FallbackWindowAuditView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedCreatedAt + parsedBudget;
}
