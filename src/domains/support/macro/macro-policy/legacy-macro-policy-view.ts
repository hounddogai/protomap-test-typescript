import * as text from "../../../../kit/text.js";
import { LegacyMacroPolicy } from "./legacy-macro-policy.js";

/** How screens and exports show a legacy macro policy. */
export class LegacyMacroPolicyView {
  code: string;
  title: string;
  campaignRef: string;
  channel: string;
  country: string;
  graceDays: string;
  audienceId: string;
  batchSize: string;
  category: string;
  floorValue: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    channel: string,
    country: string,
    graceDays: string,
    audienceId: string,
    batchSize: string,
    category: string,
    floorValue: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.country = country;
    this.graceDays = graceDays;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.category = category;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyMacroPolicyView(item: LegacyMacroPolicy): LegacyMacroPolicyView {
  return new LegacyMacroPolicyView(
    item.code,
    item.title,
    text.truncate(item.campaignRef, 64),
    text.truncate(item.channel, 80),
    item.country,
    String(item.graceDays),
    item.audienceId,
    String(item.batchSize),
    item.category,
    item.floorValue.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyMacroPolicyViews(items: LegacyMacroPolicy[]): LegacyMacroPolicyView[] {
  const views: LegacyMacroPolicyView[] = [];
  for (const item of items) {
    views.push(toLegacyMacroPolicyView(item));
  }
  return views;
}

export function sumLegacyMacroPolicyView(view: LegacyMacroPolicyView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedGraceDays + parsedBatchSize + parsedFloorValue;
}
