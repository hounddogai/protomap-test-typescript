import { PlacementAllocation } from "./placement-allocation.js";

/** How screens and exports show a placement allocation. */
export class PlacementAllocationView {
  code: string;
  name: string;
  label: string;
  quantity: string;
  version: string;
  limitText: string;
  summary: string;
  pinnedText: string;
  threshold: string;
  locale: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    label: string,
    quantity: string,
    version: string,
    limitText: string,
    summary: string,
    pinnedText: string,
    threshold: string,
    locale: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.quantity = quantity;
    this.version = version;
    this.limitText = limitText;
    this.summary = summary;
    this.pinnedText = pinnedText;
    this.threshold = threshold;
    this.locale = locale;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementAllocationView(item: PlacementAllocation): PlacementAllocationView {
  return new PlacementAllocationView(
    item.code,
    item.name,
    item.label,
    String(item.quantity),
    String(item.version),
    String(item.limit),
    item.summary,
    `${item.pinned}`,
    item.threshold.toFixed(2),
    item.locale,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementAllocationViews(items: PlacementAllocation[]): PlacementAllocationView[] {
  const views: PlacementAllocationView[] = [];
  for (const item of items) {
    views.push(toPlacementAllocationView(item));
  }
  return views;
}

export function sumPlacementAllocationView(view: PlacementAllocationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedQuantity + parsedVersion + parsedLimit;
}
