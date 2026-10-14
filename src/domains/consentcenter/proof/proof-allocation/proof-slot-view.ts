import { ProofSlot } from "./proof-slot.js";

/** How screens and exports show a proof slot. */
export class ProofSlotView {
  code: string;
  titleText: string;
  currencyText: string;
  openRateText: string;
  capacity: string;
  journeyId: string;
  createdAt: string;
  conversionRate: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    currencyText: string,
    openRateText: string,
    capacity: string,
    journeyId: string,
    createdAt: string,
    conversionRate: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.currencyText = currencyText;
    this.openRateText = openRateText;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toProofSlotView(item: ProofSlot): ProofSlotView {
  return new ProofSlotView(
    item.code,
    item.title,
    item.currency,
    item.openRate.toFixed(2),
    String(item.capacity),
    item.journeyId,
    String(item.createdAt),
    item.conversionRate.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofSlotViews(items: ProofSlot[]): ProofSlotView[] {
  const views: ProofSlotView[] = [];
  for (const item of items) {
    views.push(toProofSlotView(item));
  }
  return views;
}

export function sumProofSlotView(view: ProofSlotView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedOpenRate + parsedCapacity + parsedCreatedAt;
}
