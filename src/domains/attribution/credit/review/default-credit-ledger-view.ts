import { DefaultCreditLedger } from "./default-credit-ledger.js";

/** How screens and exports show a default credit ledger. */
export class DefaultCreditLedgerView {
  code: string;
  titleText: string;
  archived: string;
  frequencyCapText: string;
  segment: string;
  batchSize: string;
  activeText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    archived: string,
    frequencyCapText: string,
    segment: string,
    batchSize: string,
    activeText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.archived = archived;
    this.frequencyCapText = frequencyCapText;
    this.segment = segment;
    this.batchSize = batchSize;
    this.activeText = activeText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCreditLedgerView(item: DefaultCreditLedger): DefaultCreditLedgerView {
  return new DefaultCreditLedgerView(
    item.code,
    item.title,
    `${item.archived}`,
    String(item.frequencyCap),
    item.segment,
    String(item.batchSize),
    `${item.active}`,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCreditLedgerViews(items: DefaultCreditLedger[]): DefaultCreditLedgerView[] {
  const views: DefaultCreditLedgerView[] = [];
  for (const item of items) {
    views.push(toDefaultCreditLedgerView(item));
  }
  return views;
}

export function sumDefaultCreditLedgerView(view: DefaultCreditLedgerView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedFrequencyCap + parsedBatchSize;
}
