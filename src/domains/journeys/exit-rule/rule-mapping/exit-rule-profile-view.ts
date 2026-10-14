import * as text from "../../../../kit/text.js";
import { ExitRuleProfile } from "./exit-rule-profile.js";

/** How screens and exports show a exit rule profile. */
export class ExitRuleProfileView {
  code: string;
  label: string;
  minimumText: string;
  ratio: string;
  segment: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimumText: string,
    ratio: string,
    segment: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimumText = minimumText;
    this.ratio = ratio;
    this.segment = segment;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleProfileView(item: ExitRuleProfile): ExitRuleProfileView {
  return new ExitRuleProfileView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    item.ratio.toFixed(2),
    text.truncate(item.segment, 80),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleProfileViews(items: ExitRuleProfile[]): ExitRuleProfileView[] {
  const views: ExitRuleProfileView[] = [];
  for (const item of items) {
    views.push(toExitRuleProfileView(item));
  }
  return views;
}

export function sumExitRuleProfileView(view: ExitRuleProfileView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedMinimum + parsedRatio;
}
