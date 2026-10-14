import * as text from "../../../../kit/text.js";
import { BatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

/** How screens and exports show a batched exit rule mapping. */
export class BatchedExitRuleMappingView {
  code: string;
  labelText: string;
  weight: string;
  locale: string;
  reviewer: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    weight: string,
    locale: string,
    reviewer: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.weight = weight;
    this.locale = locale;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedExitRuleMappingView(item: BatchedExitRuleMapping): BatchedExitRuleMappingView {
  return new BatchedExitRuleMappingView(
    text.truncate(item.code, 40),
    item.label,
    item.weight.toFixed(2),
    item.locale,
    item.reviewer,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedExitRuleMappingViews(items: BatchedExitRuleMapping[]): BatchedExitRuleMappingView[] {
  const views: BatchedExitRuleMappingView[] = [];
  for (const item of items) {
    views.push(toBatchedExitRuleMappingView(item));
  }
  return views;
}

export function sumBatchedExitRuleMappingView(view: BatchedExitRuleMappingView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedWeight + parsedOpenRate;
}
