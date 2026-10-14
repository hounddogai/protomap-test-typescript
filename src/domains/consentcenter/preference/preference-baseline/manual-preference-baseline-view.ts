import * as text from "../../../../kit/text.js";
import { ManualPreferenceBaseline } from "./manual-preference-baseline.js";

/** How screens and exports show a manual preference baseline. */
export class ManualPreferenceBaselineView {
  code: string;
  title: string;
  sequenceText: string;
  ratio: string;
  description: string;
  discount: string;
  activeText: string;
  bid: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sequenceText: string,
    ratio: string,
    description: string,
    discount: string,
    activeText: string,
    bid: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sequenceText = sequenceText;
    this.ratio = ratio;
    this.description = description;
    this.discount = discount;
    this.activeText = activeText;
    this.bid = bid;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toManualPreferenceBaselineView(item: ManualPreferenceBaseline): ManualPreferenceBaselineView {
  return new ManualPreferenceBaselineView(
    item.code,
    item.title,
    String(item.sequence),
    item.ratio.toFixed(2),
    text.truncate(item.description, 40),
    item.discount.toFixed(2),
    `${item.active}`,
    item.bid.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPreferenceBaselineViews(items: ManualPreferenceBaseline[]): ManualPreferenceBaselineView[] {
  const views: ManualPreferenceBaselineView[] = [];
  for (const item of items) {
    views.push(toManualPreferenceBaselineView(item));
  }
  return views;
}

export function sumManualPreferenceBaselineView(view: ManualPreferenceBaselineView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedSequence + parsedRatio + parsedDiscount;
}
