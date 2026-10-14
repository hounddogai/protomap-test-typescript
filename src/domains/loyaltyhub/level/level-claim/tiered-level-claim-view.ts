import * as text from "../../../../kit/text.js";
import { TieredLevelClaim } from "./tiered-level-claim.js";

/** How screens and exports show a tiered level claim. */
export class TieredLevelClaimView {
  codeText: string;
  title: string;
  attempts: string;
  cost: string;
  countryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    attempts: string,
    cost: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.attempts = attempts;
    this.cost = cost;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredLevelClaimView(item: TieredLevelClaim): TieredLevelClaimView {
  return new TieredLevelClaimView(
    item.code,
    item.title,
    String(item.attempts),
    item.cost.toFixed(2),
    text.truncate(item.country, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredLevelClaimViews(items: TieredLevelClaim[]): TieredLevelClaimView[] {
  const views: TieredLevelClaimView[] = [];
  for (const item of items) {
    views.push(toTieredLevelClaimView(item));
  }
  return views;
}

export function sumTieredLevelClaimView(view: TieredLevelClaimView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedAttempts + parsedCost;
}
