import * as text from "../../../../kit/text.js";
import { FallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

/** How screens and exports show a fallback reward rule request. */
export class FallbackRewardRuleRequestView {
  code: string;
  labelText: string;
  sequence: string;
  windowDays: string;
  priority: string;
  country: string;
  margin: string;
  frequencyCap: string;
  title: string;
  timezone: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sequence: string,
    windowDays: string,
    priority: string,
    country: string,
    margin: string,
    frequencyCap: string,
    title: string,
    timezone: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sequence = sequence;
    this.windowDays = windowDays;
    this.priority = priority;
    this.country = country;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.title = title;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackRewardRuleRequestView(item: FallbackRewardRuleRequest): FallbackRewardRuleRequestView {
  return new FallbackRewardRuleRequestView(
    item.code,
    text.truncate(item.label, 64),
    String(item.sequence),
    String(item.windowDays),
    String(item.priority),
    item.country,
    item.margin.toFixed(2),
    String(item.frequencyCap),
    item.title,
    item.timezone,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackRewardRuleRequestViews(items: FallbackRewardRuleRequest[]): FallbackRewardRuleRequestView[] {
  const views: FallbackRewardRuleRequestView[] = [];
  for (const item of items) {
    views.push(toFallbackRewardRuleRequestView(item));
  }
  return views;
}

export function sumFallbackRewardRuleRequestView(view: FallbackRewardRuleRequestView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedSequence + parsedWindowDays + parsedPriority;
}
