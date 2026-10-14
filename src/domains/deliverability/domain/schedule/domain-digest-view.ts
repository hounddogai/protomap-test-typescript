import { DomainDigest } from "./domain-digest.js";

/** How screens and exports show a domain digest. */
export class DomainDigestView {
  code: string;
  name: string;
  rate: string;
  cost: string;
  floorValue: string;
  budget: string;
  approvedText: string;
  segment: string;
  weightText: string;
  bidText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    cost: string,
    floorValue: string,
    budget: string,
    approvedText: string,
    segment: string,
    weightText: string,
    bidText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.cost = cost;
    this.floorValue = floorValue;
    this.budget = budget;
    this.approvedText = approvedText;
    this.segment = segment;
    this.weightText = weightText;
    this.bidText = bidText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toDomainDigestView(item: DomainDigest): DomainDigestView {
  return new DomainDigestView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    item.budget.toFixed(2),
    `${item.approved}`,
    item.segment,
    item.weight.toFixed(2),
    item.bid.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainDigestViews(items: DomainDigest[]): DomainDigestView[] {
  const views: DomainDigestView[] = [];
  for (const item of items) {
    views.push(toDomainDigestView(item));
  }
  return views;
}

export function sumDomainDigestView(view: DomainDigestView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedRate + parsedCost + parsedFloorValue;
}
