import { MentionBaseline } from "./mention-baseline.js";

/** How screens and exports show a mention baseline. */
export class MentionBaselineView {
  codeText: string;
  nameText: string;
  conversionRateText: string;
  ratioText: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    conversionRateText: string,
    ratioText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.conversionRateText = conversionRateText;
    this.ratioText = ratioText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toMentionBaselineView(item: MentionBaseline): MentionBaselineView {
  return new MentionBaselineView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    item.ratio.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionBaselineViews(items: MentionBaseline[]): MentionBaselineView[] {
  const views: MentionBaselineView[] = [];
  for (const item of items) {
    views.push(toMentionBaselineView(item));
  }
  return views;
}

export function sumMentionBaselineView(view: MentionBaselineView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedConversionRate + parsedRatio + parsedRate;
}
