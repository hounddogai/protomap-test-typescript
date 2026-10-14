import * as text from "../../../../kit/text.js";
import { DefaultRewardRuleWindow } from "./default-reward-rule-window.js";

/** How screens and exports show a default reward rule window. */
export class DefaultRewardRuleWindowView {
  code: string;
  titleText: string;
  maximum: string;
  pinned: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    maximum: string,
    pinned: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.maximum = maximum;
    this.pinned = pinned;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRewardRuleWindowView(item: DefaultRewardRuleWindow): DefaultRewardRuleWindowView {
  return new DefaultRewardRuleWindowView(
    item.code,
    text.truncate(item.title, 64),
    item.maximum.toFixed(2),
    `${item.pinned}`,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRewardRuleWindowViews(items: DefaultRewardRuleWindow[]): DefaultRewardRuleWindowView[] {
  const views: DefaultRewardRuleWindowView[] = [];
  for (const item of items) {
    views.push(toDefaultRewardRuleWindowView(item));
  }
  return views;
}

export function sumDefaultRewardRuleWindowView(view: DefaultRewardRuleWindowView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedMaximum + parsedAttempts;
}
