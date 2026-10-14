import { StrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

/** How screens and exports show a strict bid rule agreement. */
export class StrictBidRuleAgreementView {
  code: string;
  label: string;
  timezoneText: string;
  frequencyCapText: string;
  batchSize: string;
  title: string;
  sendAtText: string;
  sourceText: string;
  summaryText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezoneText: string,
    frequencyCapText: string,
    batchSize: string,
    title: string,
    sendAtText: string,
    sourceText: string,
    summaryText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezoneText = timezoneText;
    this.frequencyCapText = frequencyCapText;
    this.batchSize = batchSize;
    this.title = title;
    this.sendAtText = sendAtText;
    this.sourceText = sourceText;
    this.summaryText = summaryText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBidRuleAgreementView(item: StrictBidRuleAgreement): StrictBidRuleAgreementView {
  return new StrictBidRuleAgreementView(
    item.code,
    item.label,
    item.timezone,
    String(item.frequencyCap),
    String(item.batchSize),
    item.title,
    String(item.sendAt),
    item.source,
    item.summary,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBidRuleAgreementViews(items: StrictBidRuleAgreement[]): StrictBidRuleAgreementView[] {
  const views: StrictBidRuleAgreementView[] = [];
  for (const item of items) {
    views.push(toStrictBidRuleAgreementView(item));
  }
  return views;
}

export function sumStrictBidRuleAgreementView(view: StrictBidRuleAgreementView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedFrequencyCap + parsedBatchSize + parsedSendAt;
}
