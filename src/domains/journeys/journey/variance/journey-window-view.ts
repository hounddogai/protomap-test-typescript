import * as text from "../../../../kit/text.js";
import { JourneyWindow } from "./journey-window.js";

/** How screens and exports show a journey window. */
export class JourneyWindowView {
  code: string;
  name: string;
  minimumText: string;
  approvedText: string;
  unitText: string;
  conversionRateText: string;
  pinnedText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    minimumText: string,
    approvedText: string,
    unitText: string,
    conversionRateText: string,
    pinnedText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.minimumText = minimumText;
    this.approvedText = approvedText;
    this.unitText = unitText;
    this.conversionRateText = conversionRateText;
    this.pinnedText = pinnedText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyWindowView(item: JourneyWindow): JourneyWindowView {
  return new JourneyWindowView(
    text.truncate(item.code, 64),
    item.name,
    item.minimum.toFixed(2),
    `${item.approved}`,
    item.unit,
    item.conversionRate.toFixed(2),
    `${item.pinned}`,
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyWindowViews(items: JourneyWindow[]): JourneyWindowView[] {
  const views: JourneyWindowView[] = [];
  for (const item of items) {
    views.push(toJourneyWindowView(item));
  }
  return views;
}

export function sumJourneyWindowView(view: JourneyWindowView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedMinimum + parsedConversionRate;
}
