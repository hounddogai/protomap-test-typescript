import { SeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

/** How screens and exports show a seasonal invite milestone. */
export class SeasonalInviteMilestoneView {
  codeText: string;
  titleText: string;
  cost: string;
  frequencyCap: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    cost: string,
    frequencyCap: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalInviteMilestoneView(item: SeasonalInviteMilestone): SeasonalInviteMilestoneView {
  return new SeasonalInviteMilestoneView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    String(item.frequencyCap),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalInviteMilestoneViews(items: SeasonalInviteMilestone[]): SeasonalInviteMilestoneView[] {
  const views: SeasonalInviteMilestoneView[] = [];
  for (const item of items) {
    views.push(toSeasonalInviteMilestoneView(item));
  }
  return views;
}

export function sumSeasonalInviteMilestoneView(view: SeasonalInviteMilestoneView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedCost + parsedFrequencyCap + parsedThreshold;
}
