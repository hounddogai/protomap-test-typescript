import * as text from "../../../../kit/text.js";
import { RegionalQueueProfile } from "./regional-queue-profile.js";

/** How screens and exports show a regional queue profile. */
export class RegionalQueueProfileView {
  codeText: string;
  name: string;
  version: string;
  sendAt: string;
  batchSize: string;
  visibleText: string;
  weight: string;
  updatedAtText: string;
  discount: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    version: string,
    sendAt: string,
    batchSize: string,
    visibleText: string,
    weight: string,
    updatedAtText: string,
    discount: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.version = version;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.visibleText = visibleText;
    this.weight = weight;
    this.updatedAtText = updatedAtText;
    this.discount = discount;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalQueueProfileView(item: RegionalQueueProfile): RegionalQueueProfileView {
  return new RegionalQueueProfileView(
    item.code,
    text.truncate(item.name, 80),
    String(item.version),
    String(item.sendAt),
    String(item.batchSize),
    `${item.visible}`,
    item.weight.toFixed(2),
    String(item.updatedAt),
    item.discount.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalQueueProfileViews(items: RegionalQueueProfile[]): RegionalQueueProfileView[] {
  const views: RegionalQueueProfileView[] = [];
  for (const item of items) {
    views.push(toRegionalQueueProfileView(item));
  }
  return views;
}

export function sumRegionalQueueProfileView(view: RegionalQueueProfileView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedVersion + parsedSendAt + parsedBatchSize;
}
