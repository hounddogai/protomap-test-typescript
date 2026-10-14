import { GlobalCreditAllocation } from "./global-credit-allocation.js";

/** How screens and exports show a global credit allocation. */
export class GlobalCreditAllocationView {
  code: string;
  label: string;
  graceDays: string;
  weightText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    weightText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.weightText = weightText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalCreditAllocationView(item: GlobalCreditAllocation): GlobalCreditAllocationView {
  return new GlobalCreditAllocationView(
    item.code,
    item.label,
    String(item.graceDays),
    item.weight.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalCreditAllocationViews(items: GlobalCreditAllocation[]): GlobalCreditAllocationView[] {
  const views: GlobalCreditAllocationView[] = [];
  for (const item of items) {
    views.push(toGlobalCreditAllocationView(item));
  }
  return views;
}

export function sumGlobalCreditAllocationView(view: GlobalCreditAllocationView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedGraceDays + parsedWeight + parsedDurationMinutes;
}
