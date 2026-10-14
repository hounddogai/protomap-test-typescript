import { PlacementRule } from "./placement-rule.js";

/** How screens and exports show a placement rule. */
export class PlacementRuleView {
  code: string;
  label: string;
  marginText: string;
  windowDays: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    marginText: string,
    windowDays: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.marginText = marginText;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementRuleView(item: PlacementRule): PlacementRuleView {
  return new PlacementRuleView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    String(item.windowDays),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementRuleViews(items: PlacementRule[]): PlacementRuleView[] {
  const views: PlacementRuleView[] = [];
  for (const item of items) {
    views.push(toPlacementRuleView(item));
  }
  return views;
}

export function sumPlacementRuleView(view: PlacementRuleView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedMargin + parsedWindowDays;
}
