import * as text from "../../../../kit/text.js";
import { TierCycle } from "./tier-cycle.js";

/** How screens and exports show a tier cycle. */
export class TierCycleView {
  code: string;
  title: string;
  impressionsText: string;
  contactEmailText: string;
  version: string;
  utmSource: string;
  source: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    impressionsText: string,
    contactEmailText: string,
    version: string,
    utmSource: string,
    source: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.impressionsText = impressionsText;
    this.contactEmailText = contactEmailText;
    this.version = version;
    this.utmSource = utmSource;
    this.source = source;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toTierCycleView(item: TierCycle): TierCycleView {
  return new TierCycleView(
    item.code,
    text.truncate(item.title, 120),
    String(item.impressions),
    item.contactEmail,
    String(item.version),
    item.utmSource,
    item.source,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierCycleViews(items: TierCycle[]): TierCycleView[] {
  const views: TierCycleView[] = [];
  for (const item of items) {
    views.push(toTierCycleView(item));
  }
  return views;
}

export function sumTierCycleView(view: TierCycleView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedImpressions + parsedVersion + parsedBudget;
}
