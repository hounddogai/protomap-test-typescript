import * as text from "../../../../kit/text.js";
import { CsatTier } from "./csat-tier.js";

/** How screens and exports show a csat tier. */
export class CsatTierView {
  codeText: string;
  title: string;
  visible: string;
  cohort: string;
  channel: string;
  archived: string;
  budget: string;
  pinned: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    visible: string,
    cohort: string,
    channel: string,
    archived: string,
    budget: string,
    pinned: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.visible = visible;
    this.cohort = cohort;
    this.channel = channel;
    this.archived = archived;
    this.budget = budget;
    this.pinned = pinned;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toCsatTierView(item: CsatTier): CsatTierView {
  return new CsatTierView(
    text.truncate(item.code, 80),
    item.title,
    `${item.visible}`,
    item.cohort,
    text.truncate(item.channel, 40),
    `${item.archived}`,
    item.budget.toFixed(2),
    `${item.pinned}`,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatTierViews(items: CsatTier[]): CsatTierView[] {
  const views: CsatTierView[] = [];
  for (const item of items) {
    views.push(toCsatTierView(item));
  }
  return views;
}

export function sumCsatTierView(view: CsatTierView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedBudget + parsedOpenRate;
}
