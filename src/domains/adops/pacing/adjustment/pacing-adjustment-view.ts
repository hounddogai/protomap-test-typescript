import { PacingAdjustment } from "./pacing-adjustment.js";

/** How screens and exports show a pacing adjustment. */
export class PacingAdjustmentView {
  codeText: string;
  title: string;
  name: string;
  unitText: string;
  quantity: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    name: string,
    unitText: string,
    quantity: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.name = name;
    this.unitText = unitText;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPacingAdjustmentView(item: PacingAdjustment): PacingAdjustmentView {
  return new PacingAdjustmentView(
    item.code,
    item.title,
    item.name,
    item.unit,
    String(item.quantity),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingAdjustmentViews(items: PacingAdjustment[]): PacingAdjustmentView[] {
  const views: PacingAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPacingAdjustmentView(item));
  }
  return views;
}

export function sumPacingAdjustmentView(view: PacingAdjustmentView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedQuantity + parsedDurationMinutes;
}
