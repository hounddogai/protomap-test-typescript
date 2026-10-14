import * as text from "../../../../kit/text.js";
import { SeasonalRewardCycle } from "./seasonal-reward-cycle.js";

/** How screens and exports show a seasonal reward cycle. */
export class SeasonalRewardCycleView {
  code: string;
  nameText: string;
  graceDays: string;
  contactEmail: string;
  country: string;
  category: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    graceDays: string,
    contactEmail: string,
    country: string,
    category: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.country = country;
    this.category = category;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRewardCycleView(item: SeasonalRewardCycle): SeasonalRewardCycleView {
  return new SeasonalRewardCycleView(
    item.code,
    item.name,
    String(item.graceDays),
    item.contactEmail,
    item.country,
    item.category,
    text.truncate(item.label, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRewardCycleViews(items: SeasonalRewardCycle[]): SeasonalRewardCycleView[] {
  const views: SeasonalRewardCycleView[] = [];
  for (const item of items) {
    views.push(toSeasonalRewardCycleView(item));
  }
  return views;
}

export function sumSeasonalRewardCycleView(view: SeasonalRewardCycleView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
