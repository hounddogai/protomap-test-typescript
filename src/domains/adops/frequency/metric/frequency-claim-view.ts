import { FrequencyClaim } from "./frequency-claim.js";

/** How screens and exports show a frequency claim. */
export class FrequencyClaimView {
  code: string;
  title: string;
  approved: string;
  batchSize: string;
  localeText: string;
  budget: string;
  source: string;
  retriesText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approved: string,
    batchSize: string,
    localeText: string,
    budget: string,
    source: string,
    retriesText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.batchSize = batchSize;
    this.localeText = localeText;
    this.budget = budget;
    this.source = source;
    this.retriesText = retriesText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyClaimView(item: FrequencyClaim): FrequencyClaimView {
  return new FrequencyClaimView(
    item.code,
    item.title,
    `${item.approved}`,
    String(item.batchSize),
    item.locale,
    item.budget.toFixed(2),
    item.source,
    String(item.retries),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyClaimViews(items: FrequencyClaim[]): FrequencyClaimView[] {
  const views: FrequencyClaimView[] = [];
  for (const item of items) {
    views.push(toFrequencyClaimView(item));
  }
  return views;
}

export function sumFrequencyClaimView(view: FrequencyClaimView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedBatchSize + parsedBudget + parsedRetries;
}
