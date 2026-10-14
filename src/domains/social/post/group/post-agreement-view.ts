import { PostAgreement } from "./post-agreement.js";

/** How screens and exports show a post agreement. */
export class PostAgreementView {
  codeText: string;
  label: string;
  maximum: string;
  expiresAt: string;
  categoryText: string;
  rateText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximum: string,
    expiresAt: string,
    categoryText: string,
    rateText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
    this.categoryText = categoryText;
    this.rateText = rateText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toPostAgreementView(item: PostAgreement): PostAgreementView {
  return new PostAgreementView(
    item.code,
    item.label,
    item.maximum.toFixed(2),
    String(item.expiresAt),
    item.category,
    item.rate.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostAgreementViews(items: PostAgreement[]): PostAgreementView[] {
  const views: PostAgreementView[] = [];
  for (const item of items) {
    views.push(toPostAgreementView(item));
  }
  return views;
}

export function sumPostAgreementView(view: PostAgreementView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedMaximum + parsedExpiresAt + parsedRate;
}
