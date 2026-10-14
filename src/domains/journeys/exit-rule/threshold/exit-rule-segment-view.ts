import * as text from "../../../../kit/text.js";
import { ExitRuleSegment } from "./exit-rule-segment.js";

/** How screens and exports show a exit rule segment. */
export class ExitRuleSegmentView {
  code: string;
  titleText: string;
  frequencyCapText: string;
  categoryText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    frequencyCapText: string,
    categoryText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.frequencyCapText = frequencyCapText;
    this.categoryText = categoryText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleSegmentView(item: ExitRuleSegment): ExitRuleSegmentView {
  return new ExitRuleSegmentView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 120),
    String(item.frequencyCap),
    text.truncate(item.category, 64),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleSegmentViews(items: ExitRuleSegment[]): ExitRuleSegmentView[] {
  const views: ExitRuleSegmentView[] = [];
  for (const item of items) {
    views.push(toExitRuleSegmentView(item));
  }
  return views;
}

export function sumExitRuleSegmentView(view: ExitRuleSegmentView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedFrequencyCap + parsedCeiling;
}
