import { GlobalRewardTarget } from "./global-reward-target.js";

/** How screens and exports show a global reward target. */
export class GlobalRewardTargetView {
  code: string;
  name: string;
  impressions: string;
  campaignRef: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    impressions: string,
    campaignRef: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRewardTargetView(item: GlobalRewardTarget): GlobalRewardTargetView {
  return new GlobalRewardTargetView(
    item.code,
    item.name,
    String(item.impressions),
    item.campaignRef,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRewardTargetViews(items: GlobalRewardTarget[]): GlobalRewardTargetView[] {
  const views: GlobalRewardTargetView[] = [];
  for (const item of items) {
    views.push(toGlobalRewardTargetView(item));
  }
  return views;
}

export function sumGlobalRewardTargetView(view: GlobalRewardTargetView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedImpressions + parsedCreatedAt;
}
