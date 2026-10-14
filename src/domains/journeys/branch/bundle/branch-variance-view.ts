import * as text from "../../../../kit/text.js";
import { BranchVariance } from "./branch-variance.js";

/** How screens and exports show a branch variance. */
export class BranchVarianceView {
  code: string;
  label: string;
  approvedText: string;
  discount: string;
  createdAtText: string;
  nameText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approvedText: string,
    discount: string,
    createdAtText: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approvedText = approvedText;
    this.discount = discount;
    this.createdAtText = createdAtText;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchVarianceView(item: BranchVariance): BranchVarianceView {
  return new BranchVarianceView(
    text.truncate(item.code, 40),
    item.label,
    `${item.approved}`,
    item.discount.toFixed(2),
    String(item.createdAt),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchVarianceViews(items: BranchVariance[]): BranchVarianceView[] {
  const views: BranchVarianceView[] = [];
  for (const item of items) {
    views.push(toBranchVarianceView(item));
  }
  return views;
}

export function sumBranchVarianceView(view: BranchVarianceView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedDiscount + parsedCreatedAt;
}
