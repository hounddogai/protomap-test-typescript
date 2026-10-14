import * as text from "../../../../kit/text.js";
import { ProofMetric } from "./proof-metric.js";

/** How screens and exports show a proof metric. */
export class ProofMetricView {
  code: string;
  label: string;
  cohort: string;
  journeyIdText: string;
  audienceId: string;
  externalRefText: string;
  impressionsText: string;
  nameText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohort: string,
    journeyIdText: string,
    audienceId: string,
    externalRefText: string,
    impressionsText: string,
    nameText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.journeyIdText = journeyIdText;
    this.audienceId = audienceId;
    this.externalRefText = externalRefText;
    this.impressionsText = impressionsText;
    this.nameText = nameText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toProofMetricView(item: ProofMetric): ProofMetricView {
  return new ProofMetricView(
    item.code,
    item.label,
    item.cohort,
    item.journeyId,
    text.truncate(item.audienceId, 120),
    item.externalRef,
    String(item.impressions),
    item.name,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofMetricViews(items: ProofMetric[]): ProofMetricView[] {
  const views: ProofMetricView[] = [];
  for (const item of items) {
    views.push(toProofMetricView(item));
  }
  return views;
}

export function sumProofMetricView(view: ProofMetricView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedImpressions;
}
