import { BranchEstimate } from "./branch-estimate.js";

/** How screens and exports show a branch estimate. */
export class BranchEstimateView {
  code: string;
  titleText: string;
  version: string;
  variant: string;
  sendAtText: string;
  floorValue: string;
  ratio: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    version: string,
    variant: string,
    sendAtText: string,
    floorValue: string,
    ratio: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.version = version;
    this.variant = variant;
    this.sendAtText = sendAtText;
    this.floorValue = floorValue;
    this.ratio = ratio;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toBranchEstimateView(item: BranchEstimate): BranchEstimateView {
  return new BranchEstimateView(
    item.code,
    item.title,
    String(item.version),
    item.variant,
    String(item.sendAt),
    item.floorValue.toFixed(2),
    item.ratio.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchEstimateViews(items: BranchEstimate[]): BranchEstimateView[] {
  const views: BranchEstimateView[] = [];
  for (const item of items) {
    views.push(toBranchEstimateView(item));
  }
  return views;
}

export function sumBranchEstimateView(view: BranchEstimateView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedVersion + parsedSendAt + parsedFloorValue;
}
