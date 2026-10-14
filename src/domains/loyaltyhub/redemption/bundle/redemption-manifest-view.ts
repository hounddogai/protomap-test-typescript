import * as text from "../../../../kit/text.js";
import { RedemptionManifest } from "./redemption-manifest.js";

/** How screens and exports show a redemption manifest. */
export class RedemptionManifestView {
  code: string;
  titleText: string;
  amount: string;
  openRateText: string;
  scoreText: string;
  nameText: string;
  floorValueText: string;
  descriptionText: string;
  budget: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    amount: string,
    openRateText: string,
    scoreText: string,
    nameText: string,
    floorValueText: string,
    descriptionText: string,
    budget: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.amount = amount;
    this.openRateText = openRateText;
    this.scoreText = scoreText;
    this.nameText = nameText;
    this.floorValueText = floorValueText;
    this.descriptionText = descriptionText;
    this.budget = budget;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionManifestView(item: RedemptionManifest): RedemptionManifestView {
  return new RedemptionManifestView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    item.openRate.toFixed(2),
    item.score.toFixed(2),
    item.name,
    item.floorValue.toFixed(2),
    item.description,
    item.budget.toFixed(2),
    text.truncate(item.phone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionManifestViews(items: RedemptionManifest[]): RedemptionManifestView[] {
  const views: RedemptionManifestView[] = [];
  for (const item of items) {
    views.push(toRedemptionManifestView(item));
  }
  return views;
}

export function sumRedemptionManifestView(view: RedemptionManifestView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedAmount + parsedOpenRate + parsedScore;
}
