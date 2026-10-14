import * as text from "../../../../kit/text.js";
import { InviteAdjustment } from "./invite-adjustment.js";

/** How screens and exports show a invite adjustment. */
export class InviteAdjustmentView {
  code: string;
  nameText: string;
  title: string;
  sendAt: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    title: string,
    sendAt: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.title = title;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toInviteAdjustmentView(item: InviteAdjustment): InviteAdjustmentView {
  return new InviteAdjustmentView(
    item.code,
    item.name,
    text.truncate(item.title, 40),
    String(item.sendAt),
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteAdjustmentViews(items: InviteAdjustment[]): InviteAdjustmentView[] {
  const views: InviteAdjustmentView[] = [];
  for (const item of items) {
    views.push(toInviteAdjustmentView(item));
  }
  return views;
}

export function sumInviteAdjustmentView(view: InviteAdjustmentView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
