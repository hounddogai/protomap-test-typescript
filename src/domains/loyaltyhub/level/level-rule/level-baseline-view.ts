import * as text from "../../../../kit/text.js";
import { LevelBaseline } from "./level-baseline.js";

/** How screens and exports show a level baseline. */
export class LevelBaselineView {
  codeText: string;
  title: string;
  windowDays: string;
  archived: string;
  localeText: string;
  discount: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    windowDays: string,
    archived: string,
    localeText: string,
    discount: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.windowDays = windowDays;
    this.archived = archived;
    this.localeText = localeText;
    this.discount = discount;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toLevelBaselineView(item: LevelBaseline): LevelBaselineView {
  return new LevelBaselineView(
    text.truncate(item.code, 80),
    item.title,
    String(item.windowDays),
    `${item.archived}`,
    item.locale,
    item.discount.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelBaselineViews(items: LevelBaseline[]): LevelBaselineView[] {
  const views: LevelBaselineView[] = [];
  for (const item of items) {
    views.push(toLevelBaselineView(item));
  }
  return views;
}

export function sumLevelBaselineView(view: LevelBaselineView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedWindowDays + parsedDiscount + parsedSequence;
}
