import * as text from "../../../../kit/text.js";
import { CreativeRollup } from "./creative-rollup.js";

/** How screens and exports show a creative rollup. */
export class CreativeRollupView {
  code: string;
  title: string;
  label: string;
  durationMinutes: string;
  ceiling: string;
  journeyId: string;
  discount: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    label: string,
    durationMinutes: string,
    ceiling: string,
    journeyId: string,
    discount: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.ceiling = ceiling;
    this.journeyId = journeyId;
    this.discount = discount;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeRollupView(item: CreativeRollup): CreativeRollupView {
  return new CreativeRollupView(
    item.code,
    text.truncate(item.title, 40),
    item.label,
    String(item.durationMinutes),
    item.ceiling.toFixed(2),
    item.journeyId,
    item.discount.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeRollupViews(items: CreativeRollup[]): CreativeRollupView[] {
  const views: CreativeRollupView[] = [];
  for (const item of items) {
    views.push(toCreativeRollupView(item));
  }
  return views;
}

export function sumCreativeRollupView(view: CreativeRollupView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDurationMinutes + parsedCeiling + parsedDiscount;
}
