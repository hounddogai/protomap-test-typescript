import * as text from "../../../../kit/text.js";
import { PrimaryInviteAssignment } from "./primary-invite-assignment.js";

/** How screens and exports show a primary invite assignment. */
export class PrimaryInviteAssignmentView {
  codeText: string;
  label: string;
  variant: string;
  maximum: string;
  ratioText: string;
  channelText: string;
  rate: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    variant: string,
    maximum: string,
    ratioText: string,
    channelText: string,
    rate: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.variant = variant;
    this.maximum = maximum;
    this.ratioText = ratioText;
    this.channelText = channelText;
    this.rate = rate;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInviteAssignmentView(item: PrimaryInviteAssignment): PrimaryInviteAssignmentView {
  return new PrimaryInviteAssignmentView(
    item.code,
    item.label,
    item.variant,
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    text.truncate(item.channel, 64),
    item.rate.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInviteAssignmentViews(items: PrimaryInviteAssignment[]): PrimaryInviteAssignmentView[] {
  const views: PrimaryInviteAssignmentView[] = [];
  for (const item of items) {
    views.push(toPrimaryInviteAssignmentView(item));
  }
  return views;
}

export function sumPrimaryInviteAssignmentView(view: PrimaryInviteAssignmentView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedMaximum + parsedRatio + parsedRate;
}
