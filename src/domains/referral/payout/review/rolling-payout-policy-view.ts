import * as text from "../../../../kit/text.js";
import { RollingPayoutPolicy } from "./rolling-payout-policy.js";

/** How screens and exports show a rolling payout policy. */
export class RollingPayoutPolicyView {
  code: string;
  title: string;
  updatedAt: string;
  createdAtText: string;
  utmSource: string;
  approved: string;
  notes: string;
  channel: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    updatedAt: string,
    createdAtText: string,
    utmSource: string,
    approved: string,
    notes: string,
    channel: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.createdAtText = createdAtText;
    this.utmSource = utmSource;
    this.approved = approved;
    this.notes = notes;
    this.channel = channel;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPayoutPolicyView(item: RollingPayoutPolicy): RollingPayoutPolicyView {
  return new RollingPayoutPolicyView(
    item.code,
    item.title,
    String(item.updatedAt),
    String(item.createdAt),
    text.truncate(item.utmSource, 120),
    `${item.approved}`,
    item.notes,
    item.channel,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPayoutPolicyViews(items: RollingPayoutPolicy[]): RollingPayoutPolicyView[] {
  const views: RollingPayoutPolicyView[] = [];
  for (const item of items) {
    views.push(toRollingPayoutPolicyView(item));
  }
  return views;
}

export function sumRollingPayoutPolicyView(view: RollingPayoutPolicyView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedUpdatedAt + parsedCreatedAt;
}
