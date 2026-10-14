import * as text from "../../../../kit/text.js";
import { ApprovalEstimate } from "./approval-estimate.js";

/** How screens and exports show a approval estimate. */
export class ApprovalEstimateView {
  codeText: string;
  name: string;
  ceiling: string;
  clicks: string;
  segmentText: string;
  discount: string;
  channel: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ceiling: string,
    clicks: string,
    segmentText: string,
    discount: string,
    channel: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.segmentText = segmentText;
    this.discount = discount;
    this.channel = channel;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalEstimateView(item: ApprovalEstimate): ApprovalEstimateView {
  return new ApprovalEstimateView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    String(item.clicks),
    text.truncate(item.segment, 80),
    item.discount.toFixed(2),
    text.truncate(item.channel, 80),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalEstimateViews(items: ApprovalEstimate[]): ApprovalEstimateView[] {
  const views: ApprovalEstimateView[] = [];
  for (const item of items) {
    views.push(toApprovalEstimateView(item));
  }
  return views;
}

export function sumApprovalEstimateView(view: ApprovalEstimateView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedCeiling + parsedClicks + parsedDiscount;
}
