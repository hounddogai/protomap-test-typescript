import * as text from "../../../../kit/text.js";
import { ApprovalRecord } from "./approval-record.js";

/** How screens and exports show a approval record. */
export class ApprovalRecordView {
  code: string;
  name: string;
  amountText: string;
  weightText: string;
  minimum: string;
  budgetText: string;
  startsAt: string;
  approvedText: string;
  campaignRef: string;
  title: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    amountText: string,
    weightText: string,
    minimum: string,
    budgetText: string,
    startsAt: string,
    approvedText: string,
    campaignRef: string,
    title: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.amountText = amountText;
    this.weightText = weightText;
    this.minimum = minimum;
    this.budgetText = budgetText;
    this.startsAt = startsAt;
    this.approvedText = approvedText;
    this.campaignRef = campaignRef;
    this.title = title;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalRecordView(item: ApprovalRecord): ApprovalRecordView {
  return new ApprovalRecordView(
    item.code,
    text.truncate(item.name, 40),
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    String(item.startsAt),
    `${item.approved}`,
    item.campaignRef,
    item.title,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalRecordViews(items: ApprovalRecord[]): ApprovalRecordView[] {
  const views: ApprovalRecordView[] = [];
  for (const item of items) {
    views.push(toApprovalRecordView(item));
  }
  return views;
}

export function sumApprovalRecordView(view: ApprovalRecordView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedAmount + parsedWeight + parsedMinimum;
}
