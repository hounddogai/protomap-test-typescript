import { ReputationClaim } from "./reputation-claim.js";

/** How screens and exports show a reputation claim. */
export class ReputationClaimView {
  code: string;
  label: string;
  rateText: string;
  maximum: string;
  ratioText: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rateText: string,
    maximum: string,
    ratioText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rateText = rateText;
    this.maximum = maximum;
    this.ratioText = ratioText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toReputationClaimView(item: ReputationClaim): ReputationClaimView {
  return new ReputationClaimView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationClaimViews(items: ReputationClaim[]): ReputationClaimView[] {
  const views: ReputationClaimView[] = [];
  for (const item of items) {
    views.push(toReputationClaimView(item));
  }
  return views;
}

export function sumReputationClaimView(view: ReputationClaimView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedRate + parsedMaximum + parsedRatio;
}
