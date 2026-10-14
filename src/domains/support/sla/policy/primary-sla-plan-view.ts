import * as text from "../../../../kit/text.js";
import { PrimarySlaPlan } from "./primary-sla-plan.js";

/** How screens and exports show a primary sla plan. */
export class PrimarySlaPlanView {
  code: string;
  name: string;
  bidText: string;
  country: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bidText: string,
    country: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bidText = bidText;
    this.country = country;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySlaPlanView(item: PrimarySlaPlan): PrimarySlaPlanView {
  return new PrimarySlaPlanView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    item.bid.toFixed(2),
    text.truncate(item.country, 64),
    text.truncate(item.description, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySlaPlanViews(items: PrimarySlaPlan[]): PrimarySlaPlanView[] {
  const views: PrimarySlaPlanView[] = [];
  for (const item of items) {
    views.push(toPrimarySlaPlanView(item));
  }
  return views;
}

export function sumPrimarySlaPlanView(view: PrimarySlaPlanView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedBid;
}
