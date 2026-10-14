import { ConversionCycle } from "./conversion-cycle.js";

/** How screens and exports show a conversion cycle. */
export class ConversionCycleView {
  code: string;
  name: string;
  threshold: string;
  ownerIdText: string;
  segment: string;
  priority: string;
  country: string;
  rateText: string;
  expiresAt: string;
  reviewer: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    ownerIdText: string,
    segment: string,
    priority: string,
    country: string,
    rateText: string,
    expiresAt: string,
    reviewer: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.ownerIdText = ownerIdText;
    this.segment = segment;
    this.priority = priority;
    this.country = country;
    this.rateText = rateText;
    this.expiresAt = expiresAt;
    this.reviewer = reviewer;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toConversionCycleView(item: ConversionCycle): ConversionCycleView {
  return new ConversionCycleView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    item.ownerId,
    item.segment,
    String(item.priority),
    item.country,
    item.rate.toFixed(2),
    String(item.expiresAt),
    item.reviewer,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionCycleViews(items: ConversionCycle[]): ConversionCycleView[] {
  const views: ConversionCycleView[] = [];
  for (const item of items) {
    views.push(toConversionCycleView(item));
  }
  return views;
}

export function sumConversionCycleView(view: ConversionCycleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedThreshold + parsedPriority + parsedRate;
}
