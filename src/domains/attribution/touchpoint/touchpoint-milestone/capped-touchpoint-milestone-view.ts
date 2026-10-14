import * as text from "../../../../kit/text.js";
import { CappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

/** How screens and exports show a capped touchpoint milestone. */
export class CappedTouchpointMilestoneView {
  code: string;
  nameText: string;
  approved: string;
  utmSource: string;
  ratio: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    approved: string,
    utmSource: string,
    ratio: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.approved = approved;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toCappedTouchpointMilestoneView(item: CappedTouchpointMilestone): CappedTouchpointMilestoneView {
  return new CappedTouchpointMilestoneView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 80),
    `${item.approved}`,
    text.truncate(item.utmSource, 40),
    item.ratio.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedTouchpointMilestoneViews(items: CappedTouchpointMilestone[]): CappedTouchpointMilestoneView[] {
  const views: CappedTouchpointMilestoneView[] = [];
  for (const item of items) {
    views.push(toCappedTouchpointMilestoneView(item));
  }
  return views;
}

export function sumCappedTouchpointMilestoneView(view: CappedTouchpointMilestoneView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
