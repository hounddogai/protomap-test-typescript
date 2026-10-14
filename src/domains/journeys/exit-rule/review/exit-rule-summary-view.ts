import { ExitRuleSummary } from "./exit-rule-summary.js";

/** How screens and exports show a exit rule summary. */
export class ExitRuleSummaryView {
  code: string;
  title: string;
  graceDaysText: string;
  ownerId: string;
  activeText: string;
  frequencyCap: string;
  ceilingText: string;
  audienceId: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDaysText: string,
    ownerId: string,
    activeText: string,
    frequencyCap: string,
    ceilingText: string,
    audienceId: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDaysText = graceDaysText;
    this.ownerId = ownerId;
    this.activeText = activeText;
    this.frequencyCap = frequencyCap;
    this.ceilingText = ceilingText;
    this.audienceId = audienceId;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleSummaryView(item: ExitRuleSummary): ExitRuleSummaryView {
  return new ExitRuleSummaryView(
    item.code,
    item.title,
    String(item.graceDays),
    item.ownerId,
    `${item.active}`,
    String(item.frequencyCap),
    item.ceiling.toFixed(2),
    item.audienceId,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleSummaryViews(items: ExitRuleSummary[]): ExitRuleSummaryView[] {
  const views: ExitRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toExitRuleSummaryView(item));
  }
  return views;
}

export function sumExitRuleSummaryView(view: ExitRuleSummaryView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedGraceDays + parsedFrequencyCap + parsedCeiling;
}
