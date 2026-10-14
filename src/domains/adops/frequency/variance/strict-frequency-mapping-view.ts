import { StrictFrequencyMapping } from "./strict-frequency-mapping.js";

/** How screens and exports show a strict frequency mapping. */
export class StrictFrequencyMappingView {
  code: string;
  titleText: string;
  description: string;
  bid: string;
  budget: string;
  timezone: string;
  category: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    description: string,
    bid: string,
    budget: string,
    timezone: string,
    category: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.description = description;
    this.bid = bid;
    this.budget = budget;
    this.timezone = timezone;
    this.category = category;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFrequencyMappingView(item: StrictFrequencyMapping): StrictFrequencyMappingView {
  return new StrictFrequencyMappingView(
    item.code,
    item.title,
    item.description,
    item.bid.toFixed(2),
    item.budget.toFixed(2),
    item.timezone,
    item.category,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFrequencyMappingViews(items: StrictFrequencyMapping[]): StrictFrequencyMappingView[] {
  const views: StrictFrequencyMappingView[] = [];
  for (const item of items) {
    views.push(toStrictFrequencyMappingView(item));
  }
  return views;
}

export function sumStrictFrequencyMappingView(view: StrictFrequencyMappingView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBid + parsedBudget + parsedSendAt;
}
