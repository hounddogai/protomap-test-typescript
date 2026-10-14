import { SeasonalDomainGroup } from "./seasonal-domain-group.js";

/** How screens and exports show a seasonal domain group. */
export class SeasonalDomainGroupView {
  code: string;
  titleText: string;
  margin: string;
  amount: string;
  currency: string;
  unit: string;
  sourceText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    margin: string,
    amount: string,
    currency: string,
    unit: string,
    sourceText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.margin = margin;
    this.amount = amount;
    this.currency = currency;
    this.unit = unit;
    this.sourceText = sourceText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDomainGroupView(item: SeasonalDomainGroup): SeasonalDomainGroupView {
  return new SeasonalDomainGroupView(
    item.code,
    item.title,
    item.margin.toFixed(2),
    item.amount.toFixed(2),
    item.currency,
    item.unit,
    item.source,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDomainGroupViews(items: SeasonalDomainGroup[]): SeasonalDomainGroupView[] {
  const views: SeasonalDomainGroupView[] = [];
  for (const item of items) {
    views.push(toSeasonalDomainGroupView(item));
  }
  return views;
}

export function sumSeasonalDomainGroupView(view: SeasonalDomainGroupView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedMargin + parsedAmount;
}
