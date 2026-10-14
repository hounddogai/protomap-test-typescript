import * as text from "../../../../kit/text.js";
import { WeightedDoubleOptInDigest } from "./weighted-double-opt-in-digest.js";

/** How screens and exports show a weighted double opt in digest. */
export class WeightedDoubleOptInDigestView {
  codeText: string;
  name: string;
  pinned: string;
  endsAt: string;
  unitText: string;
  startsAt: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    endsAt: string,
    unitText: string,
    startsAt: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.unitText = unitText;
    this.startsAt = startsAt;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedDoubleOptInDigestView(item: WeightedDoubleOptInDigest): WeightedDoubleOptInDigestView {
  return new WeightedDoubleOptInDigestView(
    item.code,
    text.truncate(item.name, 40),
    `${item.pinned}`,
    String(item.endsAt),
    item.unit,
    String(item.startsAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedDoubleOptInDigestViews(items: WeightedDoubleOptInDigest[]): WeightedDoubleOptInDigestView[] {
  const views: WeightedDoubleOptInDigestView[] = [];
  for (const item of items) {
    views.push(toWeightedDoubleOptInDigestView(item));
  }
  return views;
}

export function sumWeightedDoubleOptInDigestView(view: WeightedDoubleOptInDigestView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedEndsAt + parsedStartsAt + parsedBudget;
}
