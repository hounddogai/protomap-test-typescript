import { CreativeSnapshot } from "./creative-snapshot.js";

/** How screens and exports show a creative snapshot. */
export class CreativeSnapshotView {
  code: string;
  label: string;
  segment: string;
  bid: string;
  campaignRefText: string;
  amount: string;
  conversionRateText: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segment: string,
    bid: string,
    campaignRefText: string,
    amount: string,
    conversionRateText: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.bid = bid;
    this.campaignRefText = campaignRefText;
    this.amount = amount;
    this.conversionRateText = conversionRateText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeSnapshotView(item: CreativeSnapshot): CreativeSnapshotView {
  return new CreativeSnapshotView(
    item.code,
    item.label,
    item.segment,
    item.bid.toFixed(2),
    item.campaignRef,
    item.amount.toFixed(2),
    item.conversionRate.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeSnapshotViews(items: CreativeSnapshot[]): CreativeSnapshotView[] {
  const views: CreativeSnapshotView[] = [];
  for (const item of items) {
    views.push(toCreativeSnapshotView(item));
  }
  return views;
}

export function sumCreativeSnapshotView(view: CreativeSnapshotView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedBid + parsedAmount + parsedConversionRate;
}
