import { CappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

/** How screens and exports show a capped credit checkpoint. */
export class CappedCreditCheckpointView {
  code: string;
  name: string;
  minimum: string;
  approved: string;
  statusLabel: string;

  constructor(code: string, name: string, minimum: string, approved: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toCappedCreditCheckpointView(item: CappedCreditCheckpoint): CappedCreditCheckpointView {
  return new CappedCreditCheckpointView(
    item.code,
    item.name,
    item.minimum.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedCreditCheckpointViews(items: CappedCreditCheckpoint[]): CappedCreditCheckpointView[] {
  const views: CappedCreditCheckpointView[] = [];
  for (const item of items) {
    views.push(toCappedCreditCheckpointView(item));
  }
  return views;
}

export function sumCappedCreditCheckpointView(view: CappedCreditCheckpointView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedMinimum;
}
