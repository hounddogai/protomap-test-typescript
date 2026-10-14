import { CappedPathAllocation } from "./capped-path-allocation.js";

/** How screens and exports show a capped path allocation. */
export class CappedPathAllocationView {
  codeText: string;
  name: string;
  rate: string;
  frequencyCap: string;
  maximum: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    rate: string,
    frequencyCap: string,
    maximum: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPathAllocationView(item: CappedPathAllocation): CappedPathAllocationView {
  return new CappedPathAllocationView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    String(item.frequencyCap),
    item.maximum.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPathAllocationViews(items: CappedPathAllocation[]): CappedPathAllocationView[] {
  const views: CappedPathAllocationView[] = [];
  for (const item of items) {
    views.push(toCappedPathAllocationView(item));
  }
  return views;
}

export function sumCappedPathAllocationView(view: CappedPathAllocationView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedRate + parsedFrequencyCap + parsedMaximum;
}
