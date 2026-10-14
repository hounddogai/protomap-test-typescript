import * as text from "../../../../kit/text.js";
import { LenientPreferenceWindow } from "./lenient-preference-window.js";

/** How screens and exports show a lenient preference window. */
export class LenientPreferenceWindowView {
  code: string;
  labelText: string;
  utmSourceText: string;
  titleText: string;
  endsAt: string;
  floorValueText: string;
  audienceIdText: string;
  checksum: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    utmSourceText: string,
    titleText: string,
    endsAt: string,
    floorValueText: string,
    audienceIdText: string,
    checksum: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.utmSourceText = utmSourceText;
    this.titleText = titleText;
    this.endsAt = endsAt;
    this.floorValueText = floorValueText;
    this.audienceIdText = audienceIdText;
    this.checksum = checksum;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPreferenceWindowView(item: LenientPreferenceWindow): LenientPreferenceWindowView {
  return new LenientPreferenceWindowView(
    text.truncate(item.code, 64),
    item.label,
    item.utmSource,
    text.truncate(item.title, 80),
    String(item.endsAt),
    item.floorValue.toFixed(2),
    item.audienceId,
    item.checksum,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPreferenceWindowViews(items: LenientPreferenceWindow[]): LenientPreferenceWindowView[] {
  const views: LenientPreferenceWindowView[] = [];
  for (const item of items) {
    views.push(toLenientPreferenceWindowView(item));
  }
  return views;
}

export function sumLenientPreferenceWindowView(view: LenientPreferenceWindowView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedEndsAt + parsedFloorValue;
}
