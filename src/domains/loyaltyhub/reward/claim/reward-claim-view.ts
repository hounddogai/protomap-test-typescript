import * as text from "../../../../kit/text.js";
import { RewardClaim } from "./reward-claim.js";

/** How screens and exports show a reward claim. */
export class RewardClaimView {
  codeText: string;
  label: string;
  attempts: string;
  active: string;
  timezone: string;
  summaryText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    attempts: string,
    active: string,
    timezone: string,
    summaryText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.attempts = attempts;
    this.active = active;
    this.timezone = timezone;
    this.summaryText = summaryText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardClaimView(item: RewardClaim): RewardClaimView {
  return new RewardClaimView(
    text.truncate(item.code, 80),
    item.label,
    String(item.attempts),
    `${item.active}`,
    item.timezone,
    item.summary,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardClaimViews(items: RewardClaim[]): RewardClaimView[] {
  const views: RewardClaimView[] = [];
  for (const item of items) {
    views.push(toRewardClaimView(item));
  }
  return views;
}

export function sumRewardClaimView(view: RewardClaimView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedAttempts + parsedUpdatedAt;
}
