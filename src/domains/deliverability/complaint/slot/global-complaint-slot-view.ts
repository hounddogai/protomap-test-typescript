import * as text from "../../../../kit/text.js";
import { GlobalComplaintSlot } from "./global-complaint-slot.js";

/** How screens and exports show a global complaint slot. */
export class GlobalComplaintSlotView {
  code: string;
  name: string;
  timezone: string;
  budgetText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    budgetText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.budgetText = budgetText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalComplaintSlotView(item: GlobalComplaintSlot): GlobalComplaintSlotView {
  return new GlobalComplaintSlotView(
    item.code,
    text.truncate(item.name, 120),
    item.timezone,
    item.budget.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalComplaintSlotViews(items: GlobalComplaintSlot[]): GlobalComplaintSlotView[] {
  const views: GlobalComplaintSlotView[] = [];
  for (const item of items) {
    views.push(toGlobalComplaintSlotView(item));
  }
  return views;
}

export function sumGlobalComplaintSlotView(view: GlobalComplaintSlotView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBudget + parsedCapacity;
}
