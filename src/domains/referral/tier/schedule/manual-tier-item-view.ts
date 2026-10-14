import { ManualTierItem } from "./manual-tier-item.js";

/** How screens and exports show a manual tier item. */
export class ManualTierItemView {
  code: string;
  titleText: string;
  category: string;
  sequence: string;
  visibleText: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    category: string,
    sequence: string,
    visibleText: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.category = category;
    this.sequence = sequence;
    this.visibleText = visibleText;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toManualTierItemView(item: ManualTierItem): ManualTierItemView {
  return new ManualTierItemView(
    item.code,
    item.title,
    item.category,
    String(item.sequence),
    `${item.visible}`,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTierItemViews(items: ManualTierItem[]): ManualTierItemView[] {
  const views: ManualTierItemView[] = [];
  for (const item of items) {
    views.push(toManualTierItemView(item));
  }
  return views;
}

export function sumManualTierItemView(view: ManualTierItemView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedSequence + parsedConversionRate;
}
