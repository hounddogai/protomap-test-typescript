import * as text from "../../../../kit/text.js";
import { LegacyCreativeGroup } from "./legacy-creative-group.js";

/** How screens and exports show a legacy creative group. */
export class LegacyCreativeGroupView {
  code: string;
  nameText: string;
  cost: string;
  budget: string;
  updatedAt: string;
  sendAt: string;
  priorityText: string;
  margin: string;
  rate: string;
  locale: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    cost: string,
    budget: string,
    updatedAt: string,
    sendAt: string,
    priorityText: string,
    margin: string,
    rate: string,
    locale: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.cost = cost;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.priorityText = priorityText;
    this.margin = margin;
    this.rate = rate;
    this.locale = locale;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCreativeGroupView(item: LegacyCreativeGroup): LegacyCreativeGroupView {
  return new LegacyCreativeGroupView(
    text.truncate(item.code, 64),
    item.name,
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    String(item.updatedAt),
    String(item.sendAt),
    String(item.priority),
    item.margin.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.locale, 80),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCreativeGroupViews(items: LegacyCreativeGroup[]): LegacyCreativeGroupView[] {
  const views: LegacyCreativeGroupView[] = [];
  for (const item of items) {
    views.push(toLegacyCreativeGroupView(item));
  }
  return views;
}

export function sumLegacyCreativeGroupView(view: LegacyCreativeGroupView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedCost + parsedBudget + parsedUpdatedAt;
}
