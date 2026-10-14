import * as text from "../../../../kit/text.js";
import { LegacyCreativeWindow } from "./legacy-creative-window.js";

/** How screens and exports show a legacy creative window. */
export class LegacyCreativeWindowView {
  code: string;
  name: string;
  visible: string;
  frequencyCapText: string;
  windowDaysText: string;
  pinnedText: string;
  batchSize: string;
  label: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    frequencyCapText: string,
    windowDaysText: string,
    pinnedText: string,
    batchSize: string,
    label: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.frequencyCapText = frequencyCapText;
    this.windowDaysText = windowDaysText;
    this.pinnedText = pinnedText;
    this.batchSize = batchSize;
    this.label = label;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCreativeWindowView(item: LegacyCreativeWindow): LegacyCreativeWindowView {
  return new LegacyCreativeWindowView(
    item.code,
    item.name,
    `${item.visible}`,
    String(item.frequencyCap),
    String(item.windowDays),
    `${item.pinned}`,
    String(item.batchSize),
    text.truncate(item.label, 40),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCreativeWindowViews(items: LegacyCreativeWindow[]): LegacyCreativeWindowView[] {
  const views: LegacyCreativeWindowView[] = [];
  for (const item of items) {
    views.push(toLegacyCreativeWindowView(item));
  }
  return views;
}

export function sumLegacyCreativeWindowView(view: LegacyCreativeWindowView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedFrequencyCap + parsedWindowDays + parsedBatchSize;
}
