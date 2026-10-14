import * as text from "../../../../kit/text.js";
import { NudgeSegment } from "./nudge-segment.js";

/** How screens and exports show a nudge segment. */
export class NudgeSegmentView {
  code: string;
  label: string;
  sendAt: string;
  campaignRefText: string;
  variant: string;
  createdAtText: string;
  ownerId: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAt: string,
    campaignRefText: string,
    variant: string,
    createdAtText: string,
    ownerId: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.campaignRefText = campaignRefText;
    this.variant = variant;
    this.createdAtText = createdAtText;
    this.ownerId = ownerId;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeSegmentView(item: NudgeSegment): NudgeSegmentView {
  return new NudgeSegmentView(
    item.code,
    item.label,
    String(item.sendAt),
    item.campaignRef,
    text.truncate(item.variant, 40),
    String(item.createdAt),
    item.ownerId,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeSegmentViews(items: NudgeSegment[]): NudgeSegmentView[] {
  const views: NudgeSegmentView[] = [];
  for (const item of items) {
    views.push(toNudgeSegmentView(item));
  }
  return views;
}

export function sumNudgeSegmentView(view: NudgeSegmentView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedSendAt + parsedCreatedAt;
}
