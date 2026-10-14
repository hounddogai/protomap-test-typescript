import * as text from "../../../../kit/text.js";
import { ApprovalSegment } from "./approval-segment.js";

/** How screens and exports show a approval segment. */
export class ApprovalSegmentView {
  codeText: string;
  name: string;
  ceiling: string;
  category: string;
  revision: string;
  locale: string;
  notes: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ceiling: string,
    category: string,
    revision: string,
    locale: string,
    notes: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ceiling = ceiling;
    this.category = category;
    this.revision = revision;
    this.locale = locale;
    this.notes = notes;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalSegmentView(item: ApprovalSegment): ApprovalSegmentView {
  return new ApprovalSegmentView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    item.ceiling.toFixed(2),
    item.category,
    String(item.revision),
    text.truncate(item.locale, 64),
    text.truncate(item.notes, 64),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalSegmentViews(items: ApprovalSegment[]): ApprovalSegmentView[] {
  const views: ApprovalSegmentView[] = [];
  for (const item of items) {
    views.push(toApprovalSegmentView(item));
  }
  return views;
}

export function sumApprovalSegmentView(view: ApprovalSegmentView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedCeiling + parsedRevision + parsedQuantity;
}
