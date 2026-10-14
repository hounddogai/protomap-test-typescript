import { QueueQuota } from "./queue-quota.js";

/** How screens and exports show a queue quota. */
export class QueueQuotaView {
  code: string;
  title: string;
  openRate: string;
  cost: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRate: string,
    cost: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.cost = cost;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toQueueQuotaView(item: QueueQuota): QueueQuotaView {
  return new QueueQuotaView(
    item.code,
    item.title,
    item.openRate.toFixed(2),
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueQuotaViews(items: QueueQuota[]): QueueQuotaView[] {
  const views: QueueQuotaView[] = [];
  for (const item of items) {
    views.push(toQueueQuotaView(item));
  }
  return views;
}

export function sumQueueQuotaView(view: QueueQuotaView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedOpenRate + parsedCost + parsedFloorValue;
}
