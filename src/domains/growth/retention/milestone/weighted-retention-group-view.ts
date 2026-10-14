import * as text from "../../../../kit/text.js";
import { WeightedRetentionGroup } from "./weighted-retention-group.js";

/** How screens and exports show a weighted retention group. */
export class WeightedRetentionGroupView {
  codeText: string;
  name: string;
  checksumText: string;
  ratioText: string;
  capacityText: string;
  limitText: string;
  score: string;
  startsAt: string;
  notes: string;
  pinned: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    checksumText: string,
    ratioText: string,
    capacityText: string,
    limitText: string,
    score: string,
    startsAt: string,
    notes: string,
    pinned: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.checksumText = checksumText;
    this.ratioText = ratioText;
    this.capacityText = capacityText;
    this.limitText = limitText;
    this.score = score;
    this.startsAt = startsAt;
    this.notes = notes;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRetentionGroupView(item: WeightedRetentionGroup): WeightedRetentionGroupView {
  return new WeightedRetentionGroupView(
    item.code,
    item.name,
    text.truncate(item.checksum, 40),
    item.ratio.toFixed(2),
    String(item.capacity),
    String(item.limit),
    item.score.toFixed(2),
    String(item.startsAt),
    item.notes,
    `${item.pinned}`,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRetentionGroupViews(items: WeightedRetentionGroup[]): WeightedRetentionGroupView[] {
  const views: WeightedRetentionGroupView[] = [];
  for (const item of items) {
    views.push(toWeightedRetentionGroupView(item));
  }
  return views;
}

export function sumWeightedRetentionGroupView(view: WeightedRetentionGroupView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedRatio + parsedCapacity + parsedLimit;
}
