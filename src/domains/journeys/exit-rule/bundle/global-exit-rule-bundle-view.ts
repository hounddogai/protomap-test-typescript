import * as text from "../../../../kit/text.js";
import { GlobalExitRuleBundle } from "./global-exit-rule-bundle.js";

/** How screens and exports show a global exit rule bundle. */
export class GlobalExitRuleBundleView {
  codeText: string;
  name: string;
  cost: string;
  activeText: string;
  ratioText: string;
  source: string;
  countryText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cost: string,
    activeText: string,
    ratioText: string,
    source: string,
    countryText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cost = cost;
    this.activeText = activeText;
    this.ratioText = ratioText;
    this.source = source;
    this.countryText = countryText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalExitRuleBundleView(item: GlobalExitRuleBundle): GlobalExitRuleBundleView {
  return new GlobalExitRuleBundleView(
    text.truncate(item.code, 64),
    item.name,
    item.cost.toFixed(2),
    `${item.active}`,
    item.ratio.toFixed(2),
    item.source,
    text.truncate(item.country, 64),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalExitRuleBundleViews(items: GlobalExitRuleBundle[]): GlobalExitRuleBundleView[] {
  const views: GlobalExitRuleBundleView[] = [];
  for (const item of items) {
    views.push(toGlobalExitRuleBundleView(item));
  }
  return views;
}

export function sumGlobalExitRuleBundleView(view: GlobalExitRuleBundleView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedCost + parsedRatio;
}
