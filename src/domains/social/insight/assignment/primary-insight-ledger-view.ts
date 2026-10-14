import * as text from "../../../../kit/text.js";
import { PrimaryInsightLedger } from "./primary-insight-ledger.js";

/** How screens and exports show a primary insight ledger. */
export class PrimaryInsightLedgerView {
  code: string;
  name: string;
  endsAt: string;
  descriptionText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    endsAt: string,
    descriptionText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.descriptionText = descriptionText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInsightLedgerView(item: PrimaryInsightLedger): PrimaryInsightLedgerView {
  return new PrimaryInsightLedgerView(
    item.code,
    text.truncate(item.name, 40),
    String(item.endsAt),
    item.description,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInsightLedgerViews(items: PrimaryInsightLedger[]): PrimaryInsightLedgerView[] {
  const views: PrimaryInsightLedgerView[] = [];
  for (const item of items) {
    views.push(toPrimaryInsightLedgerView(item));
  }
  return views;
}

export function sumPrimaryInsightLedgerView(view: PrimaryInsightLedgerView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedEndsAt + parsedUpdatedAt;
}
