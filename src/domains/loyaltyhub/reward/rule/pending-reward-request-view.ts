import * as text from "../../../../kit/text.js";
import { PendingRewardRequest } from "./pending-reward-request.js";

/** How screens and exports show a pending reward request. */
export class PendingRewardRequestView {
  code: string;
  label: string;
  graceDays: string;
  utmSourceText: string;
  segment: string;
  checksum: string;
  limit: string;
  attempts: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    utmSourceText: string,
    segment: string,
    checksum: string,
    limit: string,
    attempts: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.utmSourceText = utmSourceText;
    this.segment = segment;
    this.checksum = checksum;
    this.limit = limit;
    this.attempts = attempts;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardRequestView(item: PendingRewardRequest): PendingRewardRequestView {
  return new PendingRewardRequestView(
    item.code,
    item.label,
    String(item.graceDays),
    item.utmSource,
    item.segment,
    text.truncate(item.checksum, 120),
    String(item.limit),
    String(item.attempts),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardRequestViews(items: PendingRewardRequest[]): PendingRewardRequestView[] {
  const views: PendingRewardRequestView[] = [];
  for (const item of items) {
    views.push(toPendingRewardRequestView(item));
  }
  return views;
}

export function sumPendingRewardRequestView(view: PendingRewardRequestView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedGraceDays + parsedLimit + parsedAttempts;
}
