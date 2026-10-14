import { PendingModelRollup } from "./pending-model-rollup.js";

/** How screens and exports show a pending model rollup. */
export class PendingModelRollupView {
  codeText: string;
  labelText: string;
  conversionRate: string;
  budgetText: string;
  channel: string;
  graceDays: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    conversionRate: string,
    budgetText: string,
    channel: string,
    graceDays: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.conversionRate = conversionRate;
    this.budgetText = budgetText;
    this.channel = channel;
    this.graceDays = graceDays;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPendingModelRollupView(item: PendingModelRollup): PendingModelRollupView {
  return new PendingModelRollupView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    item.budget.toFixed(2),
    item.channel,
    String(item.graceDays),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingModelRollupViews(items: PendingModelRollup[]): PendingModelRollupView[] {
  const views: PendingModelRollupView[] = [];
  for (const item of items) {
    views.push(toPendingModelRollupView(item));
  }
  return views;
}

export function sumPendingModelRollupView(view: PendingModelRollupView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedConversionRate + parsedBudget + parsedGraceDays;
}
