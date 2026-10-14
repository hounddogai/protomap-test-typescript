import * as text from "../../../../kit/text.js";
import { PayoutAgreement } from "./payout-agreement.js";

/** How screens and exports show a payout agreement. */
export class PayoutAgreementView {
  codeText: string;
  name: string;
  reviewer: string;
  ratio: string;
  durationMinutesText: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    reviewer: string,
    ratio: string,
    durationMinutesText: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.reviewer = reviewer;
    this.ratio = ratio;
    this.durationMinutesText = durationMinutesText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutAgreementView(item: PayoutAgreement): PayoutAgreementView {
  return new PayoutAgreementView(
    item.code,
    item.name,
    text.truncate(item.reviewer, 80),
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutAgreementViews(items: PayoutAgreement[]): PayoutAgreementView[] {
  const views: PayoutAgreementView[] = [];
  for (const item of items) {
    views.push(toPayoutAgreementView(item));
  }
  return views;
}

export function sumPayoutAgreementView(view: PayoutAgreementView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedRatio + parsedDurationMinutes;
}
