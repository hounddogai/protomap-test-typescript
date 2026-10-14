import * as text from "../../../../kit/text.js";
import { InviteRollup } from "./invite-rollup.js";

/** How screens and exports show a invite rollup. */
export class InviteRollupView {
  code: string;
  label: string;
  currency: string;
  segmentText: string;
  marginText: string;
  graceDaysText: string;
  journeyId: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currency: string,
    segmentText: string,
    marginText: string,
    graceDaysText: string,
    journeyId: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.segmentText = segmentText;
    this.marginText = marginText;
    this.graceDaysText = graceDaysText;
    this.journeyId = journeyId;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteRollupView(item: InviteRollup): InviteRollupView {
  return new InviteRollupView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    text.truncate(item.currency, 64),
    item.segment,
    item.margin.toFixed(2),
    String(item.graceDays),
    item.journeyId,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteRollupViews(items: InviteRollup[]): InviteRollupView[] {
  const views: InviteRollupView[] = [];
  for (const item of items) {
    views.push(toInviteRollupView(item));
  }
  return views;
}

export function sumInviteRollupView(view: InviteRollupView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedMargin + parsedGraceDays;
}
