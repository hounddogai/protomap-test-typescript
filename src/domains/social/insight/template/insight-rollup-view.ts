import * as text from "../../../../kit/text.js";
import { InsightRollup } from "./insight-rollup.js";

/** How screens and exports show a insight rollup. */
export class InsightRollupView {
  codeText: string;
  name: string;
  limitText: string;
  checksum: string;
  notesText: string;
  capacity: string;
  localeText: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    limitText: string,
    checksum: string,
    notesText: string,
    capacity: string,
    localeText: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.limitText = limitText;
    this.checksum = checksum;
    this.notesText = notesText;
    this.capacity = capacity;
    this.localeText = localeText;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightRollupView(item: InsightRollup): InsightRollupView {
  return new InsightRollupView(
    item.code,
    item.name,
    String(item.limit),
    item.checksum,
    text.truncate(item.notes, 40),
    String(item.capacity),
    text.truncate(item.locale, 120),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightRollupViews(items: InsightRollup[]): InsightRollupView[] {
  const views: InsightRollupView[] = [];
  for (const item of items) {
    views.push(toInsightRollupView(item));
  }
  return views;
}

export function sumInsightRollupView(view: InsightRollupView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedLimit + parsedCapacity;
}
