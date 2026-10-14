import { TieredEscalationSummary } from "./tiered-escalation-summary.js";

/** How screens and exports show a tiered escalation summary. */
export class TieredEscalationSummaryView {
  code: string;
  label: string;
  batchSizeText: string;
  revision: string;
  createdAt: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSizeText: string,
    revision: string,
    createdAt: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSizeText = batchSizeText;
    this.revision = revision;
    this.createdAt = createdAt;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toTieredEscalationSummaryView(item: TieredEscalationSummary): TieredEscalationSummaryView {
  return new TieredEscalationSummaryView(
    item.code,
    item.label,
    String(item.batchSize),
    String(item.revision),
    String(item.createdAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredEscalationSummaryViews(items: TieredEscalationSummary[]): TieredEscalationSummaryView[] {
  const views: TieredEscalationSummaryView[] = [];
  for (const item of items) {
    views.push(toTieredEscalationSummaryView(item));
  }
  return views;
}

export function sumTieredEscalationSummaryView(view: TieredEscalationSummaryView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBatchSize + parsedRevision + parsedCreatedAt;
}
