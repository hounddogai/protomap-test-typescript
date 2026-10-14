import * as text from "../../../../kit/text.js";
import { ManualStreakTier } from "./manual-streak-tier.js";

/** How screens and exports show a manual streak tier. */
export class ManualStreakTierView {
  codeText: string;
  nameText: string;
  locale: string;
  costText: string;
  cohort: string;
  margin: string;
  amount: string;
  countryText: string;
  channelText: string;
  audienceId: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    locale: string,
    costText: string,
    cohort: string,
    margin: string,
    amount: string,
    countryText: string,
    channelText: string,
    audienceId: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.locale = locale;
    this.costText = costText;
    this.cohort = cohort;
    this.margin = margin;
    this.amount = amount;
    this.countryText = countryText;
    this.channelText = channelText;
    this.audienceId = audienceId;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toManualStreakTierView(item: ManualStreakTier): ManualStreakTierView {
  return new ManualStreakTierView(
    item.code,
    item.name,
    text.truncate(item.locale, 120),
    item.cost.toFixed(2),
    item.cohort,
    item.margin.toFixed(2),
    item.amount.toFixed(2),
    text.truncate(item.country, 40),
    text.truncate(item.channel, 40),
    item.audienceId,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualStreakTierViews(items: ManualStreakTier[]): ManualStreakTierView[] {
  const views: ManualStreakTierView[] = [];
  for (const item of items) {
    views.push(toManualStreakTierView(item));
  }
  return views;
}

export function sumManualStreakTierView(view: ManualStreakTierView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCost + parsedMargin + parsedAmount;
}
