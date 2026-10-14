import { RollingBranchMilestone } from "./rolling-branch-milestone.js";

/** How screens and exports show a rolling branch milestone. */
export class RollingBranchMilestoneView {
  codeText: string;
  title: string;
  minimum: string;
  audienceIdText: string;
  segment: string;
  margin: string;
  cohortText: string;
  impressionsText: string;
  ratio: string;
  region: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    minimum: string,
    audienceIdText: string,
    segment: string,
    margin: string,
    cohortText: string,
    impressionsText: string,
    ratio: string,
    region: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.minimum = minimum;
    this.audienceIdText = audienceIdText;
    this.segment = segment;
    this.margin = margin;
    this.cohortText = cohortText;
    this.impressionsText = impressionsText;
    this.ratio = ratio;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBranchMilestoneView(item: RollingBranchMilestone): RollingBranchMilestoneView {
  return new RollingBranchMilestoneView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    item.audienceId,
    item.segment,
    item.margin.toFixed(2),
    item.cohort,
    String(item.impressions),
    item.ratio.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBranchMilestoneViews(items: RollingBranchMilestone[]): RollingBranchMilestoneView[] {
  const views: RollingBranchMilestoneView[] = [];
  for (const item of items) {
    views.push(toRollingBranchMilestoneView(item));
  }
  return views;
}

export function sumRollingBranchMilestoneView(view: RollingBranchMilestoneView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedMinimum + parsedMargin + parsedImpressions;
}
