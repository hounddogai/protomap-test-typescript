import * as text from "../../../../kit/text.js";
import { InviteLedger } from "./invite-ledger.js";

/** How screens and exports show a invite ledger. */
export class InviteLedgerView {
  code: string;
  titleText: string;
  endsAt: string;
  weight: string;
  createdAt: string;
  label: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    endsAt: string,
    weight: string,
    createdAt: string,
    label: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.endsAt = endsAt;
    this.weight = weight;
    this.createdAt = createdAt;
    this.label = label;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toInviteLedgerView(item: InviteLedger): InviteLedgerView {
  return new InviteLedgerView(
    item.code,
    item.title,
    String(item.endsAt),
    item.weight.toFixed(2),
    String(item.createdAt),
    text.truncate(item.label, 120),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteLedgerViews(items: InviteLedger[]): InviteLedgerView[] {
  const views: InviteLedgerView[] = [];
  for (const item of items) {
    views.push(toInviteLedgerView(item));
  }
  return views;
}

export function sumInviteLedgerView(view: InviteLedgerView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedEndsAt + parsedWeight + parsedCreatedAt;
}
