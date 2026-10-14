import * as text from "../../../../kit/text.js";
import { CreativeCycle } from "./creative-cycle.js";

/** How screens and exports show a creative cycle. */
export class CreativeCycleView {
  code: string;
  name: string;
  clicks: string;
  impressions: string;
  quantityText: string;
  maximum: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    clicks: string,
    impressions: string,
    quantityText: string,
    maximum: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.impressions = impressions;
    this.quantityText = quantityText;
    this.maximum = maximum;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeCycleView(item: CreativeCycle): CreativeCycleView {
  return new CreativeCycleView(
    item.code,
    item.name,
    String(item.clicks),
    String(item.impressions),
    String(item.quantity),
    item.maximum.toFixed(2),
    text.truncate(item.category, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeCycleViews(items: CreativeCycle[]): CreativeCycleView[] {
  const views: CreativeCycleView[] = [];
  for (const item of items) {
    views.push(toCreativeCycleView(item));
  }
  return views;
}

export function sumCreativeCycleView(view: CreativeCycleView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedClicks + parsedImpressions + parsedQuantity;
}
