import * as text from "../../../../kit/text.js";
import { GlobalInsightProfile } from "./global-insight-profile.js";

/** How screens and exports show a global insight profile. */
export class GlobalInsightProfileView {
  code: string;
  nameText: string;
  attempts: string;
  summaryText: string;
  floorValue: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    attempts: string,
    summaryText: string,
    floorValue: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.attempts = attempts;
    this.summaryText = summaryText;
    this.floorValue = floorValue;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalInsightProfileView(item: GlobalInsightProfile): GlobalInsightProfileView {
  return new GlobalInsightProfileView(
    text.truncate(item.code, 64),
    item.name,
    String(item.attempts),
    item.summary,
    item.floorValue.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalInsightProfileViews(items: GlobalInsightProfile[]): GlobalInsightProfileView[] {
  const views: GlobalInsightProfileView[] = [];
  for (const item of items) {
    views.push(toGlobalInsightProfileView(item));
  }
  return views;
}

export function sumGlobalInsightProfileView(view: GlobalInsightProfileView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedAttempts + parsedFloorValue + parsedCapacity;
}
