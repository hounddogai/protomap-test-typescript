import * as text from "../../../../kit/text.js";
import { WeightedQueueMapping } from "./weighted-queue-mapping.js";

/** How screens and exports show a weighted queue mapping. */
export class WeightedQueueMappingView {
  code: string;
  label: string;
  campaignRef: string;
  channel: string;
  visible: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    channel: string,
    visible: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.visible = visible;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedQueueMappingView(item: WeightedQueueMapping): WeightedQueueMappingView {
  return new WeightedQueueMappingView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.campaignRef, 80),
    item.channel,
    `${item.visible}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedQueueMappingViews(items: WeightedQueueMapping[]): WeightedQueueMappingView[] {
  const views: WeightedQueueMappingView[] = [];
  for (const item of items) {
    views.push(toWeightedQueueMappingView(item));
  }
  return views;
}

export function sumWeightedQueueMappingView(view: WeightedQueueMappingView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
