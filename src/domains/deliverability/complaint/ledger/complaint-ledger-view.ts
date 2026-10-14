import * as text from "../../../../kit/text.js";
import { ComplaintLedger } from "./complaint-ledger.js";

/** How screens and exports show a complaint ledger. */
export class ComplaintLedgerView {
  code: string;
  titleText: string;
  reviewer: string;
  localeText: string;
  checksum: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    reviewer: string,
    localeText: string,
    checksum: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.reviewer = reviewer;
    this.localeText = localeText;
    this.checksum = checksum;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintLedgerView(item: ComplaintLedger): ComplaintLedgerView {
  return new ComplaintLedgerView(
    text.truncate(item.code, 64),
    item.title,
    text.truncate(item.reviewer, 120),
    text.truncate(item.locale, 120),
    text.truncate(item.checksum, 40),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintLedgerViews(items: ComplaintLedger[]): ComplaintLedgerView[] {
  const views: ComplaintLedgerView[] = [];
  for (const item of items) {
    views.push(toComplaintLedgerView(item));
  }
  return views;
}

export function sumComplaintLedgerView(view: ComplaintLedgerView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedVersion;
}
