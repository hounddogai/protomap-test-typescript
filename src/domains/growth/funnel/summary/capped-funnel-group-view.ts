import * as text from "../../../../kit/text.js";
import { CappedFunnelGroup } from "./capped-funnel-group.js";

/** How screens and exports show a capped funnel group. */
export class CappedFunnelGroupView {
  code: string;
  name: string;
  quantityText: string;
  notes: string;
  utmSource: string;
  ceilingText: string;
  durationMinutes: string;
  budgetText: string;
  weight: string;
  ratio: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantityText: string,
    notes: string,
    utmSource: string,
    ceilingText: string,
    durationMinutes: string,
    budgetText: string,
    weight: string,
    ratio: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantityText = quantityText;
    this.notes = notes;
    this.utmSource = utmSource;
    this.ceilingText = ceilingText;
    this.durationMinutes = durationMinutes;
    this.budgetText = budgetText;
    this.weight = weight;
    this.ratio = ratio;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFunnelGroupView(item: CappedFunnelGroup): CappedFunnelGroupView {
  return new CappedFunnelGroupView(
    text.truncate(item.code, 80),
    item.name,
    String(item.quantity),
    item.notes,
    item.utmSource,
    item.ceiling.toFixed(2),
    String(item.durationMinutes),
    item.budget.toFixed(2),
    item.weight.toFixed(2),
    item.ratio.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFunnelGroupViews(items: CappedFunnelGroup[]): CappedFunnelGroupView[] {
  const views: CappedFunnelGroupView[] = [];
  for (const item of items) {
    views.push(toCappedFunnelGroupView(item));
  }
  return views;
}

export function sumCappedFunnelGroupView(view: CappedFunnelGroupView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedQuantity + parsedCeiling + parsedDurationMinutes;
}
