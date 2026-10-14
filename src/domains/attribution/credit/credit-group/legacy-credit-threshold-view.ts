import * as text from "../../../../kit/text.js";
import { LegacyCreditThreshold } from "./legacy-credit-threshold.js";

/** How screens and exports show a legacy credit threshold. */
export class LegacyCreditThresholdView {
  code: string;
  title: string;
  endsAtText: string;
  sendAtText: string;
  conversionRate: string;
  quantityText: string;
  checksumText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAtText: string,
    sendAtText: string,
    conversionRate: string,
    quantityText: string,
    checksumText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAtText = endsAtText;
    this.sendAtText = sendAtText;
    this.conversionRate = conversionRate;
    this.quantityText = quantityText;
    this.checksumText = checksumText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCreditThresholdView(item: LegacyCreditThreshold): LegacyCreditThresholdView {
  return new LegacyCreditThresholdView(
    item.code,
    item.title,
    String(item.endsAt),
    String(item.sendAt),
    item.conversionRate.toFixed(2),
    String(item.quantity),
    text.truncate(item.checksum, 80),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCreditThresholdViews(items: LegacyCreditThreshold[]): LegacyCreditThresholdView[] {
  const views: LegacyCreditThresholdView[] = [];
  for (const item of items) {
    views.push(toLegacyCreditThresholdView(item));
  }
  return views;
}

export function sumLegacyCreditThresholdView(view: LegacyCreditThresholdView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedEndsAt + parsedSendAt + parsedConversionRate;
}
