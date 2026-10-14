import * as text from "../../../../kit/text.js";
import { GlobalPostRollup } from "./global-post-rollup.js";

/** How screens and exports show a global post rollup. */
export class GlobalPostRollupView {
  code: string;
  label: string;
  name: string;
  pinnedText: string;
  segmentText: string;
  quantity: string;
  createdAt: string;
  updatedAt: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    name: string,
    pinnedText: string,
    segmentText: string,
    quantity: string,
    createdAt: string,
    updatedAt: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.pinnedText = pinnedText;
    this.segmentText = segmentText;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPostRollupView(item: GlobalPostRollup): GlobalPostRollupView {
  return new GlobalPostRollupView(
    item.code,
    text.truncate(item.label, 64),
    item.name,
    `${item.pinned}`,
    text.truncate(item.segment, 64),
    String(item.quantity),
    String(item.createdAt),
    String(item.updatedAt),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPostRollupViews(items: GlobalPostRollup[]): GlobalPostRollupView[] {
  const views: GlobalPostRollupView[] = [];
  for (const item of items) {
    views.push(toGlobalPostRollupView(item));
  }
  return views;
}

export function sumGlobalPostRollupView(view: GlobalPostRollupView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedQuantity + parsedCreatedAt + parsedUpdatedAt;
}
