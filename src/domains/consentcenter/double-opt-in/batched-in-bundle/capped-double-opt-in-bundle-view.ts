import { CappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

/** How screens and exports show a capped double opt in bundle. */
export class CappedDoubleOptInBundleView {
  codeText: string;
  titleText: string;
  externalRef: string;
  endsAt: string;
  ratio: string;
  variant: string;
  reviewerText: string;
  maximum: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    externalRef: string,
    endsAt: string,
    ratio: string,
    variant: string,
    reviewerText: string,
    maximum: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.externalRef = externalRef;
    this.endsAt = endsAt;
    this.ratio = ratio;
    this.variant = variant;
    this.reviewerText = reviewerText;
    this.maximum = maximum;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDoubleOptInBundleView(item: CappedDoubleOptInBundle): CappedDoubleOptInBundleView {
  return new CappedDoubleOptInBundleView(
    item.code,
    item.title,
    item.externalRef,
    String(item.endsAt),
    item.ratio.toFixed(2),
    item.variant,
    item.reviewer,
    item.maximum.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDoubleOptInBundleViews(items: CappedDoubleOptInBundle[]): CappedDoubleOptInBundleView[] {
  const views: CappedDoubleOptInBundleView[] = [];
  for (const item of items) {
    views.push(toCappedDoubleOptInBundleView(item));
  }
  return views;
}

export function sumCappedDoubleOptInBundleView(view: CappedDoubleOptInBundleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedEndsAt + parsedRatio + parsedMaximum;
}
