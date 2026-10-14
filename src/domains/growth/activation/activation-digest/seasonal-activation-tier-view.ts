import * as text from "../../../../kit/text.js";
import { SeasonalActivationTier } from "./seasonal-activation-tier.js";

/** How screens and exports show a seasonal activation tier. */
export class SeasonalActivationTierView {
  codeText: string;
  nameText: string;
  variant: string;
  categoryText: string;
  title: string;
  countryText: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    variant: string,
    categoryText: string,
    title: string,
    countryText: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.variant = variant;
    this.categoryText = categoryText;
    this.title = title;
    this.countryText = countryText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalActivationTierView(item: SeasonalActivationTier): SeasonalActivationTierView {
  return new SeasonalActivationTierView(
    item.code,
    text.truncate(item.name, 40),
    item.variant,
    item.category,
    item.title,
    text.truncate(item.country, 64),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalActivationTierViews(items: SeasonalActivationTier[]): SeasonalActivationTierView[] {
  const views: SeasonalActivationTierView[] = [];
  for (const item of items) {
    views.push(toSeasonalActivationTierView(item));
  }
  return views;
}

export function sumSeasonalActivationTierView(view: SeasonalActivationTierView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
