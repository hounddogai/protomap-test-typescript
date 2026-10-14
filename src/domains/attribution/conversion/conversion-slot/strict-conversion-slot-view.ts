import { StrictConversionSlot } from "./strict-conversion-slot.js";

/** How screens and exports show a strict conversion slot. */
export class StrictConversionSlotView {
  code: string;
  title: string;
  version: string;
  campaignRef: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    version: string,
    campaignRef: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.campaignRef = campaignRef;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictConversionSlotView(item: StrictConversionSlot): StrictConversionSlotView {
  return new StrictConversionSlotView(
    item.code,
    item.title,
    String(item.version),
    item.campaignRef,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictConversionSlotViews(items: StrictConversionSlot[]): StrictConversionSlotView[] {
  const views: StrictConversionSlotView[] = [];
  for (const item of items) {
    views.push(toStrictConversionSlotView(item));
  }
  return views;
}

export function sumStrictConversionSlotView(view: StrictConversionSlotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedVersion + parsedThreshold;
}
