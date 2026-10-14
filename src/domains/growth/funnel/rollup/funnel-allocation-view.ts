import * as text from "../../../../kit/text.js";
import { FunnelAllocation } from "./funnel-allocation.js";

/** How screens and exports show a funnel allocation. */
export class FunnelAllocationView {
  codeText: string;
  nameText: string;
  updatedAt: string;
  attemptsText: string;
  conversionRateText: string;
  checksum: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    updatedAt: string,
    attemptsText: string,
    conversionRateText: string,
    checksum: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.updatedAt = updatedAt;
    this.attemptsText = attemptsText;
    this.conversionRateText = conversionRateText;
    this.checksum = checksum;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelAllocationView(item: FunnelAllocation): FunnelAllocationView {
  return new FunnelAllocationView(
    text.truncate(item.code, 120),
    item.name,
    String(item.updatedAt),
    String(item.attempts),
    item.conversionRate.toFixed(2),
    item.checksum,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelAllocationViews(items: FunnelAllocation[]): FunnelAllocationView[] {
  const views: FunnelAllocationView[] = [];
  for (const item of items) {
    views.push(toFunnelAllocationView(item));
  }
  return views;
}

export function sumFunnelAllocationView(view: FunnelAllocationView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedUpdatedAt + parsedAttempts + parsedConversionRate;
}
