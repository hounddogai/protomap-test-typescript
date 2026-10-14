import { SlaTier } from "./sla-tier.js";

/** How screens and exports show a sla tier. */
export class SlaTierView {
  code: string;
  name: string;
  conversionRate: string;
  active: string;
  utmSourceText: string;
  batchSize: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    conversionRate: string,
    active: string,
    utmSourceText: string,
    batchSize: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.active = active;
    this.utmSourceText = utmSourceText;
    this.batchSize = batchSize;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toSlaTierView(item: SlaTier): SlaTierView {
  return new SlaTierView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    `${item.active}`,
    item.utmSource,
    String(item.batchSize),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaTierViews(items: SlaTier[]): SlaTierView[] {
  const views: SlaTierView[] = [];
  for (const item of items) {
    views.push(toSlaTierView(item));
  }
  return views;
}

export function sumSlaTierView(view: SlaTierView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedConversionRate + parsedBatchSize;
}
