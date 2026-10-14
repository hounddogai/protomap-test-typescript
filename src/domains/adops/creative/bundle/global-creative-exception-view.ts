import * as text from "../../../../kit/text.js";
import { GlobalCreativeException } from "./global-creative-exception.js";

/** How screens and exports show a global creative exception. */
export class GlobalCreativeExceptionView {
  code: string;
  label: string;
  visibleText: string;
  name: string;
  bid: string;
  ceiling: string;
  country: string;
  archived: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visibleText: string,
    name: string,
    bid: string,
    ceiling: string,
    country: string,
    archived: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visibleText = visibleText;
    this.name = name;
    this.bid = bid;
    this.ceiling = ceiling;
    this.country = country;
    this.archived = archived;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalCreativeExceptionView(item: GlobalCreativeException): GlobalCreativeExceptionView {
  return new GlobalCreativeExceptionView(
    item.code,
    item.label,
    `${item.visible}`,
    item.name,
    item.bid.toFixed(2),
    item.ceiling.toFixed(2),
    text.truncate(item.country, 64),
    `${item.archived}`,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalCreativeExceptionViews(items: GlobalCreativeException[]): GlobalCreativeExceptionView[] {
  const views: GlobalCreativeExceptionView[] = [];
  for (const item of items) {
    views.push(toGlobalCreativeExceptionView(item));
  }
  return views;
}

export function sumGlobalCreativeExceptionView(view: GlobalCreativeExceptionView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedBid + parsedCeiling + parsedPriority;
}
