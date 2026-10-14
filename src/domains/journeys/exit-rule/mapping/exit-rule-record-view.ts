import { ExitRuleRecord } from "./exit-rule-record.js";

/** How screens and exports show a exit rule record. */
export class ExitRuleRecordView {
  code: string;
  label: string;
  quantity: string;
  conversionRate: string;
  graceDays: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantity: string,
    conversionRate: string,
    graceDays: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleRecordView(item: ExitRuleRecord): ExitRuleRecordView {
  return new ExitRuleRecordView(
    item.code,
    item.label,
    String(item.quantity),
    item.conversionRate.toFixed(2),
    String(item.graceDays),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleRecordViews(items: ExitRuleRecord[]): ExitRuleRecordView[] {
  const views: ExitRuleRecordView[] = [];
  for (const item of items) {
    views.push(toExitRuleRecordView(item));
  }
  return views;
}

export function sumExitRuleRecordView(view: ExitRuleRecordView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedQuantity + parsedConversionRate + parsedGraceDays;
}
