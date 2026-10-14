import * as text from "../../../../kit/text.js";
import { TieredWaitGroup } from "./tiered-wait-group.js";

/** How screens and exports show a tiered wait group. */
export class TieredWaitGroupView {
  codeText: string;
  name: string;
  phone: string;
  country: string;
  margin: string;
  approved: string;
  title: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    phone: string,
    country: string,
    margin: string,
    approved: string,
    title: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.phone = phone;
    this.country = country;
    this.margin = margin;
    this.approved = approved;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWaitGroupView(item: TieredWaitGroup): TieredWaitGroupView {
  return new TieredWaitGroupView(
    item.code,
    item.name,
    item.phone,
    item.country,
    item.margin.toFixed(2),
    `${item.approved}`,
    text.truncate(item.title, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWaitGroupViews(items: TieredWaitGroup[]): TieredWaitGroupView[] {
  const views: TieredWaitGroupView[] = [];
  for (const item of items) {
    views.push(toTieredWaitGroupView(item));
  }
  return views;
}

export function sumTieredWaitGroupView(view: TieredWaitGroupView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMargin;
}
