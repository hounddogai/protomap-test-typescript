import * as text from "../../../../kit/text.js";
import { RegionalCsatClaim } from "./regional-csat-claim.js";

/** How screens and exports show a regional csat claim. */
export class RegionalCsatClaimView {
  code: string;
  nameText: string;
  variant: string;
  capacity: string;
  audienceId: string;
  currency: string;
  revisionText: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    variant: string,
    capacity: string,
    audienceId: string,
    currency: string,
    revisionText: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.variant = variant;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.currency = currency;
    this.revisionText = revisionText;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalCsatClaimView(item: RegionalCsatClaim): RegionalCsatClaimView {
  return new RegionalCsatClaimView(
    text.truncate(item.code, 120),
    item.name,
    item.variant,
    String(item.capacity),
    text.truncate(item.audienceId, 120),
    item.currency,
    String(item.revision),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalCsatClaimViews(items: RegionalCsatClaim[]): RegionalCsatClaimView[] {
  const views: RegionalCsatClaimView[] = [];
  for (const item of items) {
    views.push(toRegionalCsatClaimView(item));
  }
  return views;
}

export function sumRegionalCsatClaimView(view: RegionalCsatClaimView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedCapacity + parsedRevision + parsedBudget;
}
