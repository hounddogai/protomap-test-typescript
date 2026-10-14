import * as text from "../../../../kit/text.js";
import { ApprovalMapping } from "./approval-mapping.js";

/** How screens and exports show a approval mapping. */
export class ApprovalMappingView {
  codeText: string;
  label: string;
  capacity: string;
  amount: string;
  conversionRate: string;
  createdAt: string;
  budget: string;
  rateText: string;
  ceilingText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    capacity: string,
    amount: string,
    conversionRate: string,
    createdAt: string,
    budget: string,
    rateText: string,
    ceilingText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.capacity = capacity;
    this.amount = amount;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.budget = budget;
    this.rateText = rateText;
    this.ceilingText = ceilingText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalMappingView(item: ApprovalMapping): ApprovalMappingView {
  return new ApprovalMappingView(
    item.code,
    text.truncate(item.label, 80),
    String(item.capacity),
    item.amount.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.createdAt),
    item.budget.toFixed(2),
    item.rate.toFixed(2),
    item.ceiling.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalMappingViews(items: ApprovalMapping[]): ApprovalMappingView[] {
  const views: ApprovalMappingView[] = [];
  for (const item of items) {
    views.push(toApprovalMappingView(item));
  }
  return views;
}

export function sumApprovalMappingView(view: ApprovalMappingView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedCapacity + parsedAmount + parsedConversionRate;
}
