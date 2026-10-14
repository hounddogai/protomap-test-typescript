import * as text from "../../../../kit/text.js";
import { BranchLedger } from "./branch-ledger.js";

/** How screens and exports show a branch ledger. */
export class BranchLedgerView {
  code: string;
  title: string;
  revision: string;
  margin: string;
  labelText: string;
  description: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revision: string,
    margin: string,
    labelText: string,
    description: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.margin = margin;
    this.labelText = labelText;
    this.description = description;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchLedgerView(item: BranchLedger): BranchLedgerView {
  return new BranchLedgerView(
    item.code,
    item.title,
    String(item.revision),
    item.margin.toFixed(2),
    text.truncate(item.label, 40),
    text.truncate(item.description, 64),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchLedgerViews(items: BranchLedger[]): BranchLedgerView[] {
  const views: BranchLedgerView[] = [];
  for (const item of items) {
    views.push(toBranchLedgerView(item));
  }
  return views;
}

export function sumBranchLedgerView(view: BranchLedgerView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRevision + parsedMargin;
}
