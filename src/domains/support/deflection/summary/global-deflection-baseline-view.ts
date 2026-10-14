import * as text from "../../../../kit/text.js";
import { GlobalDeflectionBaseline } from "./global-deflection-baseline.js";

/** How screens and exports show a global deflection baseline. */
export class GlobalDeflectionBaselineView {
  code: string;
  label: string;
  locale: string;
  descriptionText: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    descriptionText: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.descriptionText = descriptionText;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalDeflectionBaselineView(item: GlobalDeflectionBaseline): GlobalDeflectionBaselineView {
  return new GlobalDeflectionBaselineView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    item.locale,
    item.description,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalDeflectionBaselineViews(items: GlobalDeflectionBaseline[]): GlobalDeflectionBaselineView[] {
  const views: GlobalDeflectionBaselineView[] = [];
  for (const item of items) {
    views.push(toGlobalDeflectionBaselineView(item));
  }
  return views;
}

export function sumGlobalDeflectionBaselineView(view: GlobalDeflectionBaselineView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedCost;
}
