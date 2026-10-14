import * as text from "../../../../kit/text.js";
import { RollingRewardRequest } from "./rolling-reward-request.js";

/** How screens and exports show a rolling reward request. */
export class RollingRewardRequestView {
  code: string;
  label: string;
  campaignRef: string;
  phoneText: string;
  reviewer: string;
  attempts: string;
  region: string;
  cohort: string;
  impressionsText: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    phoneText: string,
    reviewer: string,
    attempts: string,
    region: string,
    cohort: string,
    impressionsText: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.phoneText = phoneText;
    this.reviewer = reviewer;
    this.attempts = attempts;
    this.region = region;
    this.cohort = cohort;
    this.impressionsText = impressionsText;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingRewardRequestView(item: RollingRewardRequest): RollingRewardRequestView {
  return new RollingRewardRequestView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.campaignRef, 64),
    text.truncate(item.phone, 80),
    item.reviewer,
    String(item.attempts),
    item.region,
    item.cohort,
    String(item.impressions),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingRewardRequestViews(items: RollingRewardRequest[]): RollingRewardRequestView[] {
  const views: RollingRewardRequestView[] = [];
  for (const item of items) {
    views.push(toRollingRewardRequestView(item));
  }
  return views;
}

export function sumRollingRewardRequestView(view: RollingRewardRequestView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedAttempts + parsedImpressions;
}
