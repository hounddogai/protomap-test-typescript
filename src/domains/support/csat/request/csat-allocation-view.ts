import { CsatAllocation } from "./csat-allocation.js";

/** How screens and exports show a csat allocation. */
export class CsatAllocationView {
  code: string;
  name: string;
  startsAt: string;
  floorValue: string;
  ownerId: string;
  weight: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    floorValue: string,
    ownerId: string,
    weight: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.weight = weight;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toCsatAllocationView(item: CsatAllocation): CsatAllocationView {
  return new CsatAllocationView(
    item.code,
    item.name,
    String(item.startsAt),
    item.floorValue.toFixed(2),
    item.ownerId,
    item.weight.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatAllocationViews(items: CsatAllocation[]): CsatAllocationView[] {
  const views: CsatAllocationView[] = [];
  for (const item of items) {
    views.push(toCsatAllocationView(item));
  }
  return views;
}

export function sumCsatAllocationView(view: CsatAllocationView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedStartsAt + parsedFloorValue + parsedWeight;
}
