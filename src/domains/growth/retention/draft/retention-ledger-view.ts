import { RetentionLedger } from "./retention-ledger.js";

/** How screens and exports show a retention ledger. */
export class RetentionLedgerView {
  codeText: string;
  name: string;
  costText: string;
  segment: string;
  conversionRate: string;
  campaignRef: string;
  maximum: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    costText: string,
    segment: string,
    conversionRate: string,
    campaignRef: string,
    maximum: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.costText = costText;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionLedgerView(item: RetentionLedger): RetentionLedgerView {
  return new RetentionLedgerView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    item.segment,
    item.conversionRate.toFixed(2),
    item.campaignRef,
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionLedgerViews(items: RetentionLedger[]): RetentionLedgerView[] {
  const views: RetentionLedgerView[] = [];
  for (const item of items) {
    views.push(toRetentionLedgerView(item));
  }
  return views;
}

export function sumRetentionLedgerView(view: RetentionLedgerView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedCost + parsedConversionRate + parsedMaximum;
}
