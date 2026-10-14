import { BatchedFunnelRule } from "./batched-funnel-rule.js";

/** How screens and exports show a batched funnel rule. */
export class BatchedFunnelRuleView {
  code: string;
  nameText: string;
  impressions: string;
  journeyId: string;
  graceDaysText: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    impressions: string,
    journeyId: string,
    graceDaysText: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.graceDaysText = graceDaysText;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFunnelRuleView(item: BatchedFunnelRule): BatchedFunnelRuleView {
  return new BatchedFunnelRuleView(
    item.code,
    item.name,
    String(item.impressions),
    item.journeyId,
    String(item.graceDays),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFunnelRuleViews(items: BatchedFunnelRule[]): BatchedFunnelRuleView[] {
  const views: BatchedFunnelRuleView[] = [];
  for (const item of items) {
    views.push(toBatchedFunnelRuleView(item));
  }
  return views;
}

export function sumBatchedFunnelRuleView(view: BatchedFunnelRuleView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedImpressions + parsedGraceDays + parsedOpenRate;
}
