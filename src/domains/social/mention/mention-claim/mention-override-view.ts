import * as text from "../../../../kit/text.js";
import { MentionOverride } from "./mention-override.js";

/** How screens and exports show a mention override. */
export class MentionOverrideView {
  code: string;
  title: string;
  variantText: string;
  cohort: string;
  description: string;
  minimumText: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    variantText: string,
    cohort: string,
    description: string,
    minimumText: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.variantText = variantText;
    this.cohort = cohort;
    this.description = description;
    this.minimumText = minimumText;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toMentionOverrideView(item: MentionOverride): MentionOverrideView {
  return new MentionOverrideView(
    item.code,
    item.title,
    item.variant,
    item.cohort,
    item.description,
    item.minimum.toFixed(2),
    text.truncate(item.label, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionOverrideViews(items: MentionOverride[]): MentionOverrideView[] {
  const views: MentionOverrideView[] = [];
  for (const item of items) {
    views.push(toMentionOverrideView(item));
  }
  return views;
}

export function sumMentionOverrideView(view: MentionOverrideView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedMinimum;
}
