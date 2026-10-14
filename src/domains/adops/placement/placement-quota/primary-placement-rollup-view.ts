import * as text from "../../../../kit/text.js";
import { PrimaryPlacementRollup } from "./primary-placement-rollup.js";

/** How screens and exports show a primary placement rollup. */
export class PrimaryPlacementRollupView {
  code: string;
  name: string;
  frequencyCapText: string;
  costText: string;
  locale: string;
  bid: string;
  channel: string;
  floorValueText: string;
  budgetText: string;
  openRate: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    frequencyCapText: string,
    costText: string,
    locale: string,
    bid: string,
    channel: string,
    floorValueText: string,
    budgetText: string,
    openRate: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCapText = frequencyCapText;
    this.costText = costText;
    this.locale = locale;
    this.bid = bid;
    this.channel = channel;
    this.floorValueText = floorValueText;
    this.budgetText = budgetText;
    this.openRate = openRate;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPlacementRollupView(item: PrimaryPlacementRollup): PrimaryPlacementRollupView {
  return new PrimaryPlacementRollupView(
    text.truncate(item.code, 40),
    item.name,
    String(item.frequencyCap),
    item.cost.toFixed(2),
    item.locale,
    item.bid.toFixed(2),
    item.channel,
    item.floorValue.toFixed(2),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPlacementRollupViews(items: PrimaryPlacementRollup[]): PrimaryPlacementRollupView[] {
  const views: PrimaryPlacementRollupView[] = [];
  for (const item of items) {
    views.push(toPrimaryPlacementRollupView(item));
  }
  return views;
}

export function sumPrimaryPlacementRollupView(view: PrimaryPlacementRollupView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedFrequencyCap + parsedCost + parsedBid;
}
