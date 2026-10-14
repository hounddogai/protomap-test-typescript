import { BatchedCohortBundle } from "./batched-cohort-bundle.js";

/** How screens and exports show a batched cohort bundle. */
export class BatchedCohortBundleView {
  codeText: string;
  labelText: string;
  discountText: string;
  visibleText: string;
  contactEmailText: string;
  regionText: string;
  externalRef: string;
  journeyId: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    discountText: string,
    visibleText: string,
    contactEmailText: string,
    regionText: string,
    externalRef: string,
    journeyId: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.discountText = discountText;
    this.visibleText = visibleText;
    this.contactEmailText = contactEmailText;
    this.regionText = regionText;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCohortBundleView(item: BatchedCohortBundle): BatchedCohortBundleView {
  return new BatchedCohortBundleView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    `${item.visible}`,
    item.contactEmail,
    item.region,
    item.externalRef,
    item.journeyId,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCohortBundleViews(items: BatchedCohortBundle[]): BatchedCohortBundleView[] {
  const views: BatchedCohortBundleView[] = [];
  for (const item of items) {
    views.push(toBatchedCohortBundleView(item));
  }
  return views;
}

export function sumBatchedCohortBundleView(view: BatchedCohortBundleView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedDiscount + parsedFrequencyCap;
}
