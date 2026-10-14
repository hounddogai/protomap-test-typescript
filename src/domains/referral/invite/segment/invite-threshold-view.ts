import * as text from "../../../../kit/text.js";
import { InviteThreshold } from "./invite-threshold.js";

/** How screens and exports show a invite threshold. */
export class InviteThresholdView {
  code: string;
  title: string;
  revision: string;
  description: string;
  ratio: string;
  phone: string;
  label: string;
  campaignRef: string;
  notes: string;
  pinnedText: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revision: string,
    description: string,
    ratio: string,
    phone: string,
    label: string,
    campaignRef: string,
    notes: string,
    pinnedText: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.description = description;
    this.ratio = ratio;
    this.phone = phone;
    this.label = label;
    this.campaignRef = campaignRef;
    this.notes = notes;
    this.pinnedText = pinnedText;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteThresholdView(item: InviteThreshold): InviteThresholdView {
  return new InviteThresholdView(
    item.code,
    text.truncate(item.title, 80),
    String(item.revision),
    item.description,
    item.ratio.toFixed(2),
    item.phone,
    text.truncate(item.label, 64),
    item.campaignRef,
    item.notes,
    `${item.pinned}`,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteThresholdViews(items: InviteThreshold[]): InviteThresholdView[] {
  const views: InviteThresholdView[] = [];
  for (const item of items) {
    views.push(toInviteThresholdView(item));
  }
  return views;
}

export function sumInviteThresholdView(view: InviteThresholdView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRevision + parsedRatio;
}
