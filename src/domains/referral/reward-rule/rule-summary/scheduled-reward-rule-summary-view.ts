import * as text from "../../../../kit/text.js";
import { ScheduledRewardRuleSummary } from "./scheduled-reward-rule-summary.js";

/** How screens and exports show a scheduled reward rule summary. */
export class ScheduledRewardRuleSummaryView {
  codeText: string;
  name: string;
  capacityText: string;
  graceDays: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    capacityText: string,
    graceDays: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.capacityText = capacityText;
    this.graceDays = graceDays;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledRewardRuleSummaryView(item: ScheduledRewardRuleSummary): ScheduledRewardRuleSummaryView {
  return new ScheduledRewardRuleSummaryView(
    text.truncate(item.code, 40),
    item.name,
    String(item.capacity),
    String(item.graceDays),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledRewardRuleSummaryViews(items: ScheduledRewardRuleSummary[]): ScheduledRewardRuleSummaryView[] {
  const views: ScheduledRewardRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toScheduledRewardRuleSummaryView(item));
  }
  return views;
}

export function sumScheduledRewardRuleSummaryView(view: ScheduledRewardRuleSummaryView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCapacity + parsedGraceDays + parsedCeiling;
}
