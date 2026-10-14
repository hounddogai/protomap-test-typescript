import * as text from "../../../../kit/text.js";
import { TieredCreativeOverride } from "./tiered-creative-override.js";

/** How screens and exports show a tiered creative override. */
export class TieredCreativeOverrideView {
  code: string;
  title: string;
  timezone: string;
  margin: string;
  budget: string;
  sequenceText: string;
  name: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezone: string,
    margin: string,
    budget: string,
    sequenceText: string,
    name: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.margin = margin;
    this.budget = budget;
    this.sequenceText = sequenceText;
    this.name = name;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCreativeOverrideView(item: TieredCreativeOverride): TieredCreativeOverrideView {
  return new TieredCreativeOverrideView(
    item.code,
    text.truncate(item.title, 120),
    item.timezone,
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    String(item.sequence),
    item.name,
    text.truncate(item.checksum, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCreativeOverrideViews(items: TieredCreativeOverride[]): TieredCreativeOverrideView[] {
  const views: TieredCreativeOverrideView[] = [];
  for (const item of items) {
    views.push(toTieredCreativeOverrideView(item));
  }
  return views;
}

export function sumTieredCreativeOverrideView(view: TieredCreativeOverrideView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedMargin + parsedBudget + parsedSequence;
}
