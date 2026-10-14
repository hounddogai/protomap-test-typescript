import * as text from "../../../../kit/text.js";
import { LegacyBranchSummary } from "./legacy-branch-summary.js";

/** How screens and exports show a legacy branch summary. */
export class LegacyBranchSummaryView {
  codeText: string;
  labelText: string;
  discountText: string;
  checksumText: string;
  titleText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    discountText: string,
    checksumText: string,
    titleText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.discountText = discountText;
    this.checksumText = checksumText;
    this.titleText = titleText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBranchSummaryView(item: LegacyBranchSummary): LegacyBranchSummaryView {
  return new LegacyBranchSummaryView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    text.truncate(item.checksum, 80),
    item.title,
    text.truncate(item.cohort, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBranchSummaryViews(items: LegacyBranchSummary[]): LegacyBranchSummaryView[] {
  const views: LegacyBranchSummaryView[] = [];
  for (const item of items) {
    views.push(toLegacyBranchSummaryView(item));
  }
  return views;
}

export function sumLegacyBranchSummaryView(view: LegacyBranchSummaryView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedDiscount;
}
