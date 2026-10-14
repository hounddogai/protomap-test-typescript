import { RedemptionSlot } from "./redemption-slot.js";

/** How screens and exports show a redemption slot. */
export class RedemptionSlotView {
  codeText: string;
  nameText: string;
  channel: string;
  floorValueText: string;
  category: string;
  priorityText: string;
  pinned: string;
  variantText: string;
  minimum: string;
  budgetText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    channel: string,
    floorValueText: string,
    category: string,
    priorityText: string,
    pinned: string,
    variantText: string,
    minimum: string,
    budgetText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.channel = channel;
    this.floorValueText = floorValueText;
    this.category = category;
    this.priorityText = priorityText;
    this.pinned = pinned;
    this.variantText = variantText;
    this.minimum = minimum;
    this.budgetText = budgetText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionSlotView(item: RedemptionSlot): RedemptionSlotView {
  return new RedemptionSlotView(
    item.code,
    item.name,
    item.channel,
    item.floorValue.toFixed(2),
    item.category,
    String(item.priority),
    `${item.pinned}`,
    item.variant,
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionSlotViews(items: RedemptionSlot[]): RedemptionSlotView[] {
  const views: RedemptionSlotView[] = [];
  for (const item of items) {
    views.push(toRedemptionSlotView(item));
  }
  return views;
}

export function sumRedemptionSlotView(view: RedemptionSlotView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedFloorValue + parsedPriority + parsedMinimum;
}
