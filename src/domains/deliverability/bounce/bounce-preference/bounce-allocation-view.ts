import * as text from "../../../../kit/text.js";
import { BounceAllocation } from "./bounce-allocation.js";

/** How screens and exports show a bounce allocation. */
export class BounceAllocationView {
  code: string;
  label: string;
  ratio: string;
  journeyId: string;
  contactEmail: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ratio: string,
    journeyId: string,
    contactEmail: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toBounceAllocationView(item: BounceAllocation): BounceAllocationView {
  return new BounceAllocationView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    item.ratio.toFixed(2),
    item.journeyId,
    item.contactEmail,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceAllocationViews(items: BounceAllocation[]): BounceAllocationView[] {
  const views: BounceAllocationView[] = [];
  for (const item of items) {
    views.push(toBounceAllocationView(item));
  }
  return views;
}

export function sumBounceAllocationView(view: BounceAllocationView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
