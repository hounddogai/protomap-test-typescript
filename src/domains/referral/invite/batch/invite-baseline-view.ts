import * as text from "../../../../kit/text.js";
import { InviteBaseline } from "./invite-baseline.js";

/** How screens and exports show a invite baseline. */
export class InviteBaselineView {
  code: string;
  labelText: string;
  channel: string;
  cohort: string;
  discount: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    cohort: string,
    discount: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.cohort = cohort;
    this.discount = discount;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteBaselineView(item: InviteBaseline): InviteBaselineView {
  return new InviteBaselineView(
    item.code,
    text.truncate(item.label, 40),
    item.channel,
    text.truncate(item.cohort, 40),
    item.discount.toFixed(2),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteBaselineViews(items: InviteBaseline[]): InviteBaselineView[] {
  const views: InviteBaselineView[] = [];
  for (const item of items) {
    views.push(toInviteBaselineView(item));
  }
  return views;
}

export function sumInviteBaselineView(view: InviteBaselineView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedDiscount + parsedVersion;
}
