import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

/** How screens and exports show a primary exit rule tier. */
export class PrimaryExitRuleTierView {
  code: string;
  title: string;
  graceDays: string;
  updatedAtText: string;
  archived: string;
  thresholdText: string;
  margin: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    updatedAtText: string,
    archived: string,
    thresholdText: string,
    margin: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.updatedAtText = updatedAtText;
    this.archived = archived;
    this.thresholdText = thresholdText;
    this.margin = margin;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryExitRuleTierView(item: PrimaryExitRuleTier): PrimaryExitRuleTierView {
  return new PrimaryExitRuleTierView(
    item.code,
    text.truncate(item.title, 80),
    String(item.graceDays),
    String(item.updatedAt),
    `${item.archived}`,
    item.threshold.toFixed(2),
    item.margin.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryExitRuleTierViews(items: PrimaryExitRuleTier[]): PrimaryExitRuleTierView[] {
  const views: PrimaryExitRuleTierView[] = [];
  for (const item of items) {
    views.push(toPrimaryExitRuleTierView(item));
  }
  return views;
}

export function sumPrimaryExitRuleTierView(view: PrimaryExitRuleTierView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedGraceDays + parsedUpdatedAt + parsedThreshold;
}
