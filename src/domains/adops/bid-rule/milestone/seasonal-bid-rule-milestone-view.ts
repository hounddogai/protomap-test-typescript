import * as text from "../../../../kit/text.js";
import { SeasonalBidRuleMilestone } from "./seasonal-bid-rule-milestone.js";

/** How screens and exports show a seasonal bid rule milestone. */
export class SeasonalBidRuleMilestoneView {
  codeText: string;
  titleText: string;
  visible: string;
  checksumText: string;
  category: string;
  externalRefText: string;
  cohort: string;
  bid: string;
  name: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    visible: string,
    checksumText: string,
    category: string,
    externalRefText: string,
    cohort: string,
    bid: string,
    name: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.visible = visible;
    this.checksumText = checksumText;
    this.category = category;
    this.externalRefText = externalRefText;
    this.cohort = cohort;
    this.bid = bid;
    this.name = name;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalBidRuleMilestoneView(item: SeasonalBidRuleMilestone): SeasonalBidRuleMilestoneView {
  return new SeasonalBidRuleMilestoneView(
    item.code,
    item.title,
    `${item.visible}`,
    text.truncate(item.checksum, 120),
    item.category,
    item.externalRef,
    text.truncate(item.cohort, 40),
    item.bid.toFixed(2),
    item.name,
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalBidRuleMilestoneViews(items: SeasonalBidRuleMilestone[]): SeasonalBidRuleMilestoneView[] {
  const views: SeasonalBidRuleMilestoneView[] = [];
  for (const item of items) {
    views.push(toSeasonalBidRuleMilestoneView(item));
  }
  return views;
}

export function sumSeasonalBidRuleMilestoneView(view: SeasonalBidRuleMilestoneView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
