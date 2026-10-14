import * as text from "../../../../kit/text.js";
import { SeasonalModelAudit } from "./seasonal-model-audit.js";

/** How screens and exports show a seasonal model audit. */
export class SeasonalModelAuditView {
  codeText: string;
  label: string;
  conversionRateText: string;
  quantity: string;
  contactEmail: string;
  budget: string;
  approved: string;
  score: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    conversionRateText: string,
    quantity: string,
    contactEmail: string,
    budget: string,
    approved: string,
    score: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.conversionRateText = conversionRateText;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.approved = approved;
    this.score = score;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalModelAuditView(item: SeasonalModelAudit): SeasonalModelAuditView {
  return new SeasonalModelAuditView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    String(item.quantity),
    text.truncate(item.contactEmail, 80),
    item.budget.toFixed(2),
    `${item.approved}`,
    item.score.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalModelAuditViews(items: SeasonalModelAudit[]): SeasonalModelAuditView[] {
  const views: SeasonalModelAuditView[] = [];
  for (const item of items) {
    views.push(toSeasonalModelAuditView(item));
  }
  return views;
}

export function sumSeasonalModelAuditView(view: SeasonalModelAuditView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedConversionRate + parsedQuantity + parsedBudget;
}
