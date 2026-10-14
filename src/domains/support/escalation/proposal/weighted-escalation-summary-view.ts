import * as text from "../../../../kit/text.js";
import { WeightedEscalationSummary } from "./weighted-escalation-summary.js";

/** How screens and exports show a weighted escalation summary. */
export class WeightedEscalationSummaryView {
  code: string;
  label: string;
  graceDays: string;
  rate: string;
  revision: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    rate: string,
    revision: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.rate = rate;
    this.revision = revision;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedEscalationSummaryView(item: WeightedEscalationSummary): WeightedEscalationSummaryView {
  return new WeightedEscalationSummaryView(
    item.code,
    text.truncate(item.label, 40),
    String(item.graceDays),
    item.rate.toFixed(2),
    String(item.revision),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedEscalationSummaryViews(items: WeightedEscalationSummary[]): WeightedEscalationSummaryView[] {
  const views: WeightedEscalationSummaryView[] = [];
  for (const item of items) {
    views.push(toWeightedEscalationSummaryView(item));
  }
  return views;
}

export function sumWeightedEscalationSummaryView(view: WeightedEscalationSummaryView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedGraceDays + parsedRate + parsedRevision;
}
