import * as text from "../../../../kit/text.js";
import { QueuePolicy } from "./queue-policy.js";

/** How screens and exports show a queue policy. */
export class QueuePolicyView {
  code: string;
  label: string;
  floorValueText: string;
  batchSize: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValueText: string,
    batchSize: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValueText = floorValueText;
    this.batchSize = batchSize;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toQueuePolicyView(item: QueuePolicy): QueuePolicyView {
  return new QueuePolicyView(
    text.truncate(item.code, 40),
    item.label,
    item.floorValue.toFixed(2),
    String(item.batchSize),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toQueuePolicyViews(items: QueuePolicy[]): QueuePolicyView[] {
  const views: QueuePolicyView[] = [];
  for (const item of items) {
    views.push(toQueuePolicyView(item));
  }
  return views;
}

export function sumQueuePolicyView(view: QueuePolicyView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedFloorValue + parsedBatchSize;
}
