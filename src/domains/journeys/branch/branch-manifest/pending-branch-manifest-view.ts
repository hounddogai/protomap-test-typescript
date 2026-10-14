import * as text from "../../../../kit/text.js";
import { PendingBranchManifest } from "./pending-branch-manifest.js";

/** How screens and exports show a pending branch manifest. */
export class PendingBranchManifestView {
  codeText: string;
  label: string;
  country: string;
  costText: string;
  approved: string;
  discount: string;
  weightText: string;
  segment: string;
  maximum: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    country: string,
    costText: string,
    approved: string,
    discount: string,
    weightText: string,
    segment: string,
    maximum: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.country = country;
    this.costText = costText;
    this.approved = approved;
    this.discount = discount;
    this.weightText = weightText;
    this.segment = segment;
    this.maximum = maximum;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBranchManifestView(item: PendingBranchManifest): PendingBranchManifestView {
  return new PendingBranchManifestView(
    item.code,
    item.label,
    text.truncate(item.country, 40),
    item.cost.toFixed(2),
    `${item.approved}`,
    item.discount.toFixed(2),
    item.weight.toFixed(2),
    text.truncate(item.segment, 64),
    item.maximum.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBranchManifestViews(items: PendingBranchManifest[]): PendingBranchManifestView[] {
  const views: PendingBranchManifestView[] = [];
  for (const item of items) {
    views.push(toPendingBranchManifestView(item));
  }
  return views;
}

export function sumPendingBranchManifestView(view: PendingBranchManifestView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedCost + parsedDiscount + parsedWeight;
}
