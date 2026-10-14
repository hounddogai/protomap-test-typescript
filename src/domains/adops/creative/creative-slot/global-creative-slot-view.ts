import * as text from "../../../../kit/text.js";
import { GlobalCreativeSlot } from "./global-creative-slot.js";

/** How screens and exports show a global creative slot. */
export class GlobalCreativeSlotView {
  code: string;
  label: string;
  clicksText: string;
  journeyIdText: string;
  thresholdText: string;
  endsAtText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicksText: string,
    journeyIdText: string,
    thresholdText: string,
    endsAtText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicksText = clicksText;
    this.journeyIdText = journeyIdText;
    this.thresholdText = thresholdText;
    this.endsAtText = endsAtText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalCreativeSlotView(item: GlobalCreativeSlot): GlobalCreativeSlotView {
  return new GlobalCreativeSlotView(
    item.code,
    item.label,
    String(item.clicks),
    item.journeyId,
    item.threshold.toFixed(2),
    String(item.endsAt),
    text.truncate(item.cohort, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalCreativeSlotViews(items: GlobalCreativeSlot[]): GlobalCreativeSlotView[] {
  const views: GlobalCreativeSlotView[] = [];
  for (const item of items) {
    views.push(toGlobalCreativeSlotView(item));
  }
  return views;
}

export function sumGlobalCreativeSlotView(view: GlobalCreativeSlotView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedClicks + parsedThreshold + parsedEndsAt;
}
