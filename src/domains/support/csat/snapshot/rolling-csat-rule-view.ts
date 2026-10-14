import { RollingCsatRule } from "./rolling-csat-rule.js";

/** How screens and exports show a rolling csat rule. */
export class RollingCsatRuleView {
  code: string;
  name: string;
  variant: string;
  unit: string;
  openRate: string;
  source: string;
  summary: string;
  costText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    variant: string,
    unit: string,
    openRate: string,
    source: string,
    summary: string,
    costText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.unit = unit;
    this.openRate = openRate;
    this.source = source;
    this.summary = summary;
    this.costText = costText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCsatRuleView(item: RollingCsatRule): RollingCsatRuleView {
  return new RollingCsatRuleView(
    item.code,
    item.name,
    item.variant,
    item.unit,
    item.openRate.toFixed(2),
    item.source,
    item.summary,
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCsatRuleViews(items: RollingCsatRule[]): RollingCsatRuleView[] {
  const views: RollingCsatRuleView[] = [];
  for (const item of items) {
    views.push(toRollingCsatRuleView(item));
  }
  return views;
}

export function sumRollingCsatRuleView(view: RollingCsatRuleView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedOpenRate + parsedCost + parsedFloorValue;
}
