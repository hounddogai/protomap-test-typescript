import { FallbackPayoutAgreement } from "./fallback-payout-agreement.js";

/** How screens and exports show a fallback payout agreement. */
export class FallbackPayoutAgreementView {
  code: string;
  label: string;
  threshold: string;
  marginText: string;
  minimumText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    marginText: string,
    minimumText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.marginText = marginText;
    this.minimumText = minimumText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPayoutAgreementView(item: FallbackPayoutAgreement): FallbackPayoutAgreementView {
  return new FallbackPayoutAgreementView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    item.margin.toFixed(2),
    item.minimum.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPayoutAgreementViews(items: FallbackPayoutAgreement[]): FallbackPayoutAgreementView[] {
  const views: FallbackPayoutAgreementView[] = [];
  for (const item of items) {
    views.push(toFallbackPayoutAgreementView(item));
  }
  return views;
}

export function sumFallbackPayoutAgreementView(view: FallbackPayoutAgreementView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedThreshold + parsedMargin + parsedMinimum;
}
