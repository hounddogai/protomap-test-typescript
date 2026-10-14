import * as text from "../../../../kit/text.js";
import { StrictJourneyRollup } from "./strict-journey-rollup.js";

/** How screens and exports show a strict journey rollup. */
export class StrictJourneyRollupView {
  code: string;
  label: string;
  revisionText: string;
  createdAtText: string;
  regionText: string;
  budgetText: string;
  descriptionText: string;
  amount: string;
  bid: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revisionText: string,
    createdAtText: string,
    regionText: string,
    budgetText: string,
    descriptionText: string,
    amount: string,
    bid: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revisionText = revisionText;
    this.createdAtText = createdAtText;
    this.regionText = regionText;
    this.budgetText = budgetText;
    this.descriptionText = descriptionText;
    this.amount = amount;
    this.bid = bid;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictJourneyRollupView(item: StrictJourneyRollup): StrictJourneyRollupView {
  return new StrictJourneyRollupView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 64),
    String(item.revision),
    String(item.createdAt),
    item.region,
    item.budget.toFixed(2),
    item.description,
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.currency, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictJourneyRollupViews(items: StrictJourneyRollup[]): StrictJourneyRollupView[] {
  const views: StrictJourneyRollupView[] = [];
  for (const item of items) {
    views.push(toStrictJourneyRollupView(item));
  }
  return views;
}

export function sumStrictJourneyRollupView(view: StrictJourneyRollupView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedRevision + parsedCreatedAt + parsedBudget;
}
