import * as text from "../../../../kit/text.js";
import { LenientPaywallBaseline } from "./lenient-paywall-baseline.js";

/** How screens and exports show a lenient paywall baseline. */
export class LenientPaywallBaselineView {
  code: string;
  label: string;
  updatedAt: string;
  batchSize: string;
  priorityText: string;
  ownerId: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    batchSize: string,
    priorityText: string,
    ownerId: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.priorityText = priorityText;
    this.ownerId = ownerId;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPaywallBaselineView(item: LenientPaywallBaseline): LenientPaywallBaselineView {
  return new LenientPaywallBaselineView(
    item.code,
    text.truncate(item.label, 40),
    String(item.updatedAt),
    String(item.batchSize),
    String(item.priority),
    item.ownerId,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPaywallBaselineViews(items: LenientPaywallBaseline[]): LenientPaywallBaselineView[] {
  const views: LenientPaywallBaselineView[] = [];
  for (const item of items) {
    views.push(toLenientPaywallBaselineView(item));
  }
  return views;
}

export function sumLenientPaywallBaselineView(view: LenientPaywallBaselineView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedUpdatedAt + parsedBatchSize + parsedPriority;
}
