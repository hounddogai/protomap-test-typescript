import { ManualExitRuleDraft } from "./manual-exit-rule-draft.js";

/** How screens and exports show a manual exit rule draft. */
export class ManualExitRuleDraftView {
  code: string;
  title: string;
  contactEmailText: string;
  minimum: string;
  capacityText: string;
  quantity: string;
  batchSize: string;
  sendAt: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmailText: string,
    minimum: string,
    capacityText: string,
    quantity: string,
    batchSize: string,
    sendAt: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmailText = contactEmailText;
    this.minimum = minimum;
    this.capacityText = capacityText;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toManualExitRuleDraftView(item: ManualExitRuleDraft): ManualExitRuleDraftView {
  return new ManualExitRuleDraftView(
    item.code,
    item.title,
    item.contactEmail,
    item.minimum.toFixed(2),
    String(item.capacity),
    String(item.quantity),
    String(item.batchSize),
    String(item.sendAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualExitRuleDraftViews(items: ManualExitRuleDraft[]): ManualExitRuleDraftView[] {
  const views: ManualExitRuleDraftView[] = [];
  for (const item of items) {
    views.push(toManualExitRuleDraftView(item));
  }
  return views;
}

export function sumManualExitRuleDraftView(view: ManualExitRuleDraftView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMinimum + parsedCapacity + parsedQuantity;
}
