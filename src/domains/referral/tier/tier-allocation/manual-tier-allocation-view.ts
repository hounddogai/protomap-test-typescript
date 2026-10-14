import * as text from "../../../../kit/text.js";
import { ManualTierAllocation } from "./manual-tier-allocation.js";

/** How screens and exports show a manual tier allocation. */
export class ManualTierAllocationView {
  codeText: string;
  label: string;
  updatedAt: string;
  regionText: string;
  channel: string;
  audienceId: string;
  unit: string;
  maximum: string;
  category: string;
  description: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    updatedAt: string,
    regionText: string,
    channel: string,
    audienceId: string,
    unit: string,
    maximum: string,
    category: string,
    description: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.updatedAt = updatedAt;
    this.regionText = regionText;
    this.channel = channel;
    this.audienceId = audienceId;
    this.unit = unit;
    this.maximum = maximum;
    this.category = category;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toManualTierAllocationView(item: ManualTierAllocation): ManualTierAllocationView {
  return new ManualTierAllocationView(
    item.code,
    item.label,
    String(item.updatedAt),
    item.region,
    text.truncate(item.channel, 40),
    item.audienceId,
    item.unit,
    item.maximum.toFixed(2),
    item.category,
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTierAllocationViews(items: ManualTierAllocation[]): ManualTierAllocationView[] {
  const views: ManualTierAllocationView[] = [];
  for (const item of items) {
    views.push(toManualTierAllocationView(item));
  }
  return views;
}

export function sumManualTierAllocationView(view: ManualTierAllocationView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedUpdatedAt + parsedMaximum;
}
