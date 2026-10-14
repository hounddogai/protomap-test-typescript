import * as text from "../../../../kit/text.js";
import { InviteSegment } from "./invite-segment.js";

/** How screens and exports show a invite segment. */
export class InviteSegmentView {
  code: string;
  title: string;
  source: string;
  ceilingText: string;
  approved: string;
  region: string;
  amountText: string;
  nameText: string;
  sendAt: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    source: string,
    ceilingText: string,
    approved: string,
    region: string,
    amountText: string,
    nameText: string,
    sendAt: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.ceilingText = ceilingText;
    this.approved = approved;
    this.region = region;
    this.amountText = amountText;
    this.nameText = nameText;
    this.sendAt = sendAt;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteSegmentView(item: InviteSegment): InviteSegmentView {
  return new InviteSegmentView(
    item.code,
    item.title,
    text.truncate(item.source, 80),
    item.ceiling.toFixed(2),
    `${item.approved}`,
    item.region,
    item.amount.toFixed(2),
    text.truncate(item.name, 40),
    String(item.sendAt),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteSegmentViews(items: InviteSegment[]): InviteSegmentView[] {
  const views: InviteSegmentView[] = [];
  for (const item of items) {
    views.push(toInviteSegmentView(item));
  }
  return views;
}

export function sumInviteSegmentView(view: InviteSegmentView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCeiling + parsedAmount + parsedSendAt;
}
