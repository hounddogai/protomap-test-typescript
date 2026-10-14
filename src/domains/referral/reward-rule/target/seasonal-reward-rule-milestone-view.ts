import * as text from "../../../../kit/text.js";
import { SeasonalRewardRuleMilestone } from "./seasonal-reward-rule-milestone.js";

/** How screens and exports show a seasonal reward rule milestone. */
export class SeasonalRewardRuleMilestoneView {
  code: string;
  label: string;
  externalRef: string;
  variant: string;
  marginText: string;
  name: string;
  segment: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    variant: string,
    marginText: string,
    name: string,
    segment: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.variant = variant;
    this.marginText = marginText;
    this.name = name;
    this.segment = segment;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRewardRuleMilestoneView(item: SeasonalRewardRuleMilestone): SeasonalRewardRuleMilestoneView {
  return new SeasonalRewardRuleMilestoneView(
    item.code,
    text.truncate(item.label, 64),
    text.truncate(item.externalRef, 40),
    item.variant,
    item.margin.toFixed(2),
    text.truncate(item.name, 80),
    text.truncate(item.segment, 120),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRewardRuleMilestoneViews(items: SeasonalRewardRuleMilestone[]): SeasonalRewardRuleMilestoneView[] {
  const views: SeasonalRewardRuleMilestoneView[] = [];
  for (const item of items) {
    views.push(toSeasonalRewardRuleMilestoneView(item));
  }
  return views;
}

export function sumSeasonalRewardRuleMilestoneView(view: SeasonalRewardRuleMilestoneView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedMargin + parsedUpdatedAt;
}
