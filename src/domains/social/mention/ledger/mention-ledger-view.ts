import * as text from "../../../../kit/text.js";
import { MentionLedger } from "./mention-ledger.js";

/** How screens and exports show a mention ledger. */
export class MentionLedgerView {
  codeText: string;
  name: string;
  updatedAtText: string;
  ceiling: string;
  archivedText: string;
  threshold: string;
  minimum: string;
  version: string;
  utmSourceText: string;
  revision: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    updatedAtText: string,
    ceiling: string,
    archivedText: string,
    threshold: string,
    minimum: string,
    version: string,
    utmSourceText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.updatedAtText = updatedAtText;
    this.ceiling = ceiling;
    this.archivedText = archivedText;
    this.threshold = threshold;
    this.minimum = minimum;
    this.version = version;
    this.utmSourceText = utmSourceText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toMentionLedgerView(item: MentionLedger): MentionLedgerView {
  return new MentionLedgerView(
    item.code,
    item.name,
    String(item.updatedAt),
    item.ceiling.toFixed(2),
    `${item.archived}`,
    item.threshold.toFixed(2),
    item.minimum.toFixed(2),
    String(item.version),
    text.truncate(item.utmSource, 40),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionLedgerViews(items: MentionLedger[]): MentionLedgerView[] {
  const views: MentionLedgerView[] = [];
  for (const item of items) {
    views.push(toMentionLedgerView(item));
  }
  return views;
}

export function sumMentionLedgerView(view: MentionLedgerView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedUpdatedAt + parsedCeiling + parsedThreshold;
}
