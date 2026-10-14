import * as text from "../../../../kit/text.js";
import { OptOutLedger } from "./opt-out-ledger.js";

/** How screens and exports show a opt out ledger. */
export class OptOutLedgerView {
  code: string;
  name: string;
  batchSize: string;
  createdAt: string;
  frequencyCapText: string;
  segment: string;
  reviewer: string;
  contactEmail: string;
  campaignRef: string;
  retriesText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    batchSize: string,
    createdAt: string,
    frequencyCapText: string,
    segment: string,
    reviewer: string,
    contactEmail: string,
    campaignRef: string,
    retriesText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.frequencyCapText = frequencyCapText;
    this.segment = segment;
    this.reviewer = reviewer;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.retriesText = retriesText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutLedgerView(item: OptOutLedger): OptOutLedgerView {
  return new OptOutLedgerView(
    item.code,
    text.truncate(item.name, 120),
    String(item.batchSize),
    String(item.createdAt),
    String(item.frequencyCap),
    item.segment,
    item.reviewer,
    item.contactEmail,
    item.campaignRef,
    String(item.retries),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutLedgerViews(items: OptOutLedger[]): OptOutLedgerView[] {
  const views: OptOutLedgerView[] = [];
  for (const item of items) {
    views.push(toOptOutLedgerView(item));
  }
  return views;
}

export function sumOptOutLedgerView(view: OptOutLedgerView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedBatchSize + parsedCreatedAt + parsedFrequencyCap;
}
