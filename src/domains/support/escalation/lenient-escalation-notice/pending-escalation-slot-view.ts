import { PendingEscalationSlot } from "./pending-escalation-slot.js";

/** How screens and exports show a pending escalation slot. */
export class PendingEscalationSlotView {
  codeText: string;
  title: string;
  ownerId: string;
  openRate: string;
  channel: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ownerId: string,
    openRate: string,
    channel: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ownerId = ownerId;
    this.openRate = openRate;
    this.channel = channel;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toPendingEscalationSlotView(item: PendingEscalationSlot): PendingEscalationSlotView {
  return new PendingEscalationSlotView(
    item.code,
    item.title,
    item.ownerId,
    item.openRate.toFixed(2),
    item.channel,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingEscalationSlotViews(items: PendingEscalationSlot[]): PendingEscalationSlotView[] {
  const views: PendingEscalationSlotView[] = [];
  for (const item of items) {
    views.push(toPendingEscalationSlotView(item));
  }
  return views;
}

export function sumPendingEscalationSlotView(view: PendingEscalationSlotView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedOpenRate + parsedCost;
}
