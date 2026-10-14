import * as text from "../../../../kit/text.js";
import { DefaultMentionRule } from "./default-mention-rule.js";

/** How screens and exports show a default mention rule. */
export class DefaultMentionRuleView {
  codeText: string;
  label: string;
  summary: string;
  endsAt: string;
  region: string;
  reviewer: string;
  phoneText: string;
  maximum: string;
  minimum: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    summary: string,
    endsAt: string,
    region: string,
    reviewer: string,
    phoneText: string,
    maximum: string,
    minimum: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.summary = summary;
    this.endsAt = endsAt;
    this.region = region;
    this.reviewer = reviewer;
    this.phoneText = phoneText;
    this.maximum = maximum;
    this.minimum = minimum;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultMentionRuleView(item: DefaultMentionRule): DefaultMentionRuleView {
  return new DefaultMentionRuleView(
    text.truncate(item.code, 64),
    item.label,
    item.summary,
    String(item.endsAt),
    item.region,
    text.truncate(item.reviewer, 80),
    item.phone,
    item.maximum.toFixed(2),
    item.minimum.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultMentionRuleViews(items: DefaultMentionRule[]): DefaultMentionRuleView[] {
  const views: DefaultMentionRuleView[] = [];
  for (const item of items) {
    views.push(toDefaultMentionRuleView(item));
  }
  return views;
}

export function sumDefaultMentionRuleView(view: DefaultMentionRuleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedEndsAt + parsedMaximum + parsedMinimum;
}
