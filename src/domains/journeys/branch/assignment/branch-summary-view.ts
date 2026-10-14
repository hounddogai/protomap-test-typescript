import * as text from "../../../../kit/text.js";
import { BranchSummary } from "./branch-summary.js";

/** How screens and exports show a branch summary. */
export class BranchSummaryView {
  code: string;
  name: string;
  quantity: string;
  label: string;
  ratio: string;
  localeText: string;
  sendAt: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    label: string,
    ratio: string,
    localeText: string,
    sendAt: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.label = label;
    this.ratio = ratio;
    this.localeText = localeText;
    this.sendAt = sendAt;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchSummaryView(item: BranchSummary): BranchSummaryView {
  return new BranchSummaryView(
    item.code,
    text.truncate(item.name, 40),
    String(item.quantity),
    item.label,
    item.ratio.toFixed(2),
    item.locale,
    String(item.sendAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchSummaryViews(items: BranchSummary[]): BranchSummaryView[] {
  const views: BranchSummaryView[] = [];
  for (const item of items) {
    views.push(toBranchSummaryView(item));
  }
  return views;
}

export function sumBranchSummaryView(view: BranchSummaryView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedQuantity + parsedRatio + parsedSendAt;
}
