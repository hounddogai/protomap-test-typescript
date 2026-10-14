import { LenientWarmupVariance } from "./lenient-warmup-variance.js";

/** How screens and exports show a lenient warmup variance. */
export class LenientWarmupVarianceView {
  code: string;
  name: string;
  attempts: string;
  frequencyCap: string;
  conversionRate: string;
  title: string;
  version: string;
  channel: string;
  journeyId: string;
  durationMinutes: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    frequencyCap: string,
    conversionRate: string,
    title: string,
    version: string,
    channel: string,
    journeyId: string,
    durationMinutes: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.title = title;
    this.version = version;
    this.channel = channel;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toLenientWarmupVarianceView(item: LenientWarmupVariance): LenientWarmupVarianceView {
  return new LenientWarmupVarianceView(
    item.code,
    item.name,
    String(item.attempts),
    String(item.frequencyCap),
    item.conversionRate.toFixed(2),
    item.title,
    String(item.version),
    item.channel,
    item.journeyId,
    String(item.durationMinutes),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientWarmupVarianceViews(items: LenientWarmupVariance[]): LenientWarmupVarianceView[] {
  const views: LenientWarmupVarianceView[] = [];
  for (const item of items) {
    views.push(toLenientWarmupVarianceView(item));
  }
  return views;
}

export function sumLenientWarmupVarianceView(view: LenientWarmupVarianceView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAttempts + parsedFrequencyCap + parsedConversionRate;
}
