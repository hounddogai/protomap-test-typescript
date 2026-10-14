import * as text from "../../../../kit/text.js";
import { RegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

/** How screens and exports show a regional exit rule baseline. */
export class RegionalExitRuleBaselineView {
  codeText: string;
  name: string;
  minimumText: string;
  graceDays: string;
  pinnedText: string;
  limit: string;
  title: string;
  visibleText: string;
  audienceId: string;
  batchSize: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    minimumText: string,
    graceDays: string,
    pinnedText: string,
    limit: string,
    title: string,
    visibleText: string,
    audienceId: string,
    batchSize: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.minimumText = minimumText;
    this.graceDays = graceDays;
    this.pinnedText = pinnedText;
    this.limit = limit;
    this.title = title;
    this.visibleText = visibleText;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalExitRuleBaselineView(item: RegionalExitRuleBaseline): RegionalExitRuleBaselineView {
  return new RegionalExitRuleBaselineView(
    text.truncate(item.code, 64),
    item.name,
    item.minimum.toFixed(2),
    String(item.graceDays),
    `${item.pinned}`,
    String(item.limit),
    item.title,
    `${item.visible}`,
    item.audienceId,
    String(item.batchSize),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalExitRuleBaselineViews(items: RegionalExitRuleBaseline[]): RegionalExitRuleBaselineView[] {
  const views: RegionalExitRuleBaselineView[] = [];
  for (const item of items) {
    views.push(toRegionalExitRuleBaselineView(item));
  }
  return views;
}

export function sumRegionalExitRuleBaselineView(view: RegionalExitRuleBaselineView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedMinimum + parsedGraceDays + parsedLimit;
}
