import * as text from "../../../../kit/text.js";
import { LenientRewardException } from "./lenient-reward-exception.js";

/** How screens and exports show a lenient reward exception. */
export class LenientRewardExceptionView {
  code: string;
  label: string;
  reviewerText: string;
  timezone: string;
  sendAt: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewerText: string,
    timezone: string,
    sendAt: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewerText = reviewerText;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRewardExceptionView(item: LenientRewardException): LenientRewardExceptionView {
  return new LenientRewardExceptionView(
    item.code,
    item.label,
    item.reviewer,
    text.truncate(item.timezone, 120),
    String(item.sendAt),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRewardExceptionViews(items: LenientRewardException[]): LenientRewardExceptionView[] {
  const views: LenientRewardExceptionView[] = [];
  for (const item of items) {
    views.push(toLenientRewardExceptionView(item));
  }
  return views;
}

export function sumLenientRewardExceptionView(view: LenientRewardExceptionView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedSendAt + parsedRevision;
}
