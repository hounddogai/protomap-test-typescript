import { DefaultPostMilestone } from "./default-post-milestone.js";

/** How screens and exports show a default post milestone. */
export class DefaultPostMilestoneView {
  code: string;
  name: string;
  sendAt: string;
  journeyId: string;
  audienceId: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sendAt: string,
    journeyId: string,
    audienceId: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPostMilestoneView(item: DefaultPostMilestone): DefaultPostMilestoneView {
  return new DefaultPostMilestoneView(
    item.code,
    item.name,
    String(item.sendAt),
    item.journeyId,
    item.audienceId,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPostMilestoneViews(items: DefaultPostMilestone[]): DefaultPostMilestoneView[] {
  const views: DefaultPostMilestoneView[] = [];
  for (const item of items) {
    views.push(toDefaultPostMilestoneView(item));
  }
  return views;
}

export function sumDefaultPostMilestoneView(view: DefaultPostMilestoneView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedSendAt + parsedRatio;
}
