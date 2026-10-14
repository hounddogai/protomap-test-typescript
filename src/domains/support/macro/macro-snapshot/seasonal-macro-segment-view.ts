import * as text from "../../../../kit/text.js";
import { SeasonalMacroSegment } from "./seasonal-macro-segment.js";

/** How screens and exports show a seasonal macro segment. */
export class SeasonalMacroSegmentView {
  codeText: string;
  nameText: string;
  phone: string;
  rate: string;
  source: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    phone: string,
    rate: string,
    source: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.phone = phone;
    this.rate = rate;
    this.source = source;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalMacroSegmentView(item: SeasonalMacroSegment): SeasonalMacroSegmentView {
  return new SeasonalMacroSegmentView(
    item.code,
    item.name,
    item.phone,
    item.rate.toFixed(2),
    text.truncate(item.source, 40),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalMacroSegmentViews(items: SeasonalMacroSegment[]): SeasonalMacroSegmentView[] {
  const views: SeasonalMacroSegmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalMacroSegmentView(item));
  }
  return views;
}

export function sumSeasonalMacroSegmentView(view: SeasonalMacroSegmentView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
