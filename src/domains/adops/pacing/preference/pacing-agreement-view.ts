import { PacingAgreement } from "./pacing-agreement.js";

/** How screens and exports show a pacing agreement. */
export class PacingAgreementView {
  code: string;
  label: string;
  category: string;
  graceDays: string;
  bid: string;
  segment: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    graceDays: string,
    bid: string,
    segment: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.graceDays = graceDays;
    this.bid = bid;
    this.segment = segment;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toPacingAgreementView(item: PacingAgreement): PacingAgreementView {
  return new PacingAgreementView(
    item.code,
    item.label,
    item.category,
    String(item.graceDays),
    item.bid.toFixed(2),
    item.segment,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingAgreementViews(items: PacingAgreement[]): PacingAgreementView[] {
  const views: PacingAgreementView[] = [];
  for (const item of items) {
    views.push(toPacingAgreementView(item));
  }
  return views;
}

export function sumPacingAgreementView(view: PacingAgreementView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedGraceDays + parsedBid + parsedEndsAt;
}
