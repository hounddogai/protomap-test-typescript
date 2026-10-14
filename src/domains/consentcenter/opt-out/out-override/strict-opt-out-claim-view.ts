import * as text from "../../../../kit/text.js";
import { StrictOptOutClaim } from "./strict-opt-out-claim.js";

/** How screens and exports show a strict opt out claim. */
export class StrictOptOutClaimView {
  code: string;
  name: string;
  clicksText: string;
  budgetText: string;
  source: string;
  title: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    clicksText: string,
    budgetText: string,
    source: string,
    title: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.clicksText = clicksText;
    this.budgetText = budgetText;
    this.source = source;
    this.title = title;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictOptOutClaimView(item: StrictOptOutClaim): StrictOptOutClaimView {
  return new StrictOptOutClaimView(
    item.code,
    item.name,
    String(item.clicks),
    item.budget.toFixed(2),
    text.truncate(item.source, 80),
    item.title,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictOptOutClaimViews(items: StrictOptOutClaim[]): StrictOptOutClaimView[] {
  const views: StrictOptOutClaimView[] = [];
  for (const item of items) {
    views.push(toStrictOptOutClaimView(item));
  }
  return views;
}

export function sumStrictOptOutClaimView(view: StrictOptOutClaimView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedClicks + parsedBudget + parsedRate;
}
