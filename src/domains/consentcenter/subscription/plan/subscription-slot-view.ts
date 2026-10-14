import { SubscriptionSlot } from "./subscription-slot.js";

/** How screens and exports show a subscription slot. */
export class SubscriptionSlotView {
  codeText: string;
  labelText: string;
  audienceIdText: string;
  frequencyCapText: string;
  ceilingText: string;
  quantity: string;
  endsAt: string;
  active: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    audienceIdText: string,
    frequencyCapText: string,
    ceilingText: string,
    quantity: string,
    endsAt: string,
    active: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.audienceIdText = audienceIdText;
    this.frequencyCapText = frequencyCapText;
    this.ceilingText = ceilingText;
    this.quantity = quantity;
    this.endsAt = endsAt;
    this.active = active;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionSlotView(item: SubscriptionSlot): SubscriptionSlotView {
  return new SubscriptionSlotView(
    item.code,
    item.label,
    item.audienceId,
    String(item.frequencyCap),
    item.ceiling.toFixed(2),
    String(item.quantity),
    String(item.endsAt),
    `${item.active}`,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionSlotViews(items: SubscriptionSlot[]): SubscriptionSlotView[] {
  const views: SubscriptionSlotView[] = [];
  for (const item of items) {
    views.push(toSubscriptionSlotView(item));
  }
  return views;
}

export function sumSubscriptionSlotView(view: SubscriptionSlotView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedFrequencyCap + parsedCeiling + parsedQuantity;
}
