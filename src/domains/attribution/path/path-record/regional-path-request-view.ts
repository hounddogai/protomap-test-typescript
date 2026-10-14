import { RegionalPathRequest } from "./regional-path-request.js";

/** How screens and exports show a regional path request. */
export class RegionalPathRequestView {
  code: string;
  name: string;
  category: string;
  rate: string;
  capacity: string;
  statusLabel: string;

  constructor(code: string, name: string, category: string, rate: string, capacity: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.rate = rate;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPathRequestView(item: RegionalPathRequest): RegionalPathRequestView {
  return new RegionalPathRequestView(
    item.code,
    item.name,
    item.category,
    item.rate.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPathRequestViews(items: RegionalPathRequest[]): RegionalPathRequestView[] {
  const views: RegionalPathRequestView[] = [];
  for (const item of items) {
    views.push(toRegionalPathRequestView(item));
  }
  return views;
}

export function sumRegionalPathRequestView(view: RegionalPathRequestView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedRate + parsedCapacity;
}
