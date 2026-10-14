import { PacingRollup } from "./pacing-rollup.js";

/** How screens and exports show a pacing rollup. */
export class PacingRollupView {
  codeText: string;
  title: string;
  windowDays: string;
  journeyId: string;
  quantityText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    windowDays: string,
    journeyId: string,
    quantityText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.quantityText = quantityText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toPacingRollupView(item: PacingRollup): PacingRollupView {
  return new PacingRollupView(
    item.code,
    item.title,
    String(item.windowDays),
    item.journeyId,
    String(item.quantity),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingRollupViews(items: PacingRollup[]): PacingRollupView[] {
  const views: PacingRollupView[] = [];
  for (const item of items) {
    views.push(toPacingRollupView(item));
  }
  return views;
}

export function sumPacingRollupView(view: PacingRollupView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedWindowDays + parsedQuantity + parsedCeiling;
}
