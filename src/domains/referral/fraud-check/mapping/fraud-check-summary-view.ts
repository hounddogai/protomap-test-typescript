import { FraudCheckSummary } from "./fraud-check-summary.js";

/** How screens and exports show a fraud check summary. */
export class FraudCheckSummaryView {
  codeText: string;
  title: string;
  sendAt: string;
  unit: string;
  activeText: string;
  capacityText: string;
  bidText: string;
  budget: string;
  sequence: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sendAt: string,
    unit: string,
    activeText: string,
    capacityText: string,
    bidText: string,
    budget: string,
    sequence: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sendAt = sendAt;
    this.unit = unit;
    this.activeText = activeText;
    this.capacityText = capacityText;
    this.bidText = bidText;
    this.budget = budget;
    this.sequence = sequence;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckSummaryView(item: FraudCheckSummary): FraudCheckSummaryView {
  return new FraudCheckSummaryView(
    item.code,
    item.title,
    String(item.sendAt),
    item.unit,
    `${item.active}`,
    String(item.capacity),
    item.bid.toFixed(2),
    item.budget.toFixed(2),
    String(item.sequence),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckSummaryViews(items: FraudCheckSummary[]): FraudCheckSummaryView[] {
  const views: FraudCheckSummaryView[] = [];
  for (const item of items) {
    views.push(toFraudCheckSummaryView(item));
  }
  return views;
}

export function sumFraudCheckSummaryView(view: FraudCheckSummaryView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedSendAt + parsedCapacity + parsedBid;
}
