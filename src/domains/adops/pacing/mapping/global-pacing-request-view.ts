import * as text from "../../../../kit/text.js";
import { GlobalPacingRequest } from "./global-pacing-request.js";

/** How screens and exports show a global pacing request. */
export class GlobalPacingRequestView {
  codeText: string;
  label: string;
  priorityText: string;
  batchSize: string;
  cost: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priorityText: string,
    batchSize: string,
    cost: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priorityText = priorityText;
    this.batchSize = batchSize;
    this.cost = cost;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPacingRequestView(item: GlobalPacingRequest): GlobalPacingRequestView {
  return new GlobalPacingRequestView(
    text.truncate(item.code, 80),
    item.label,
    String(item.priority),
    String(item.batchSize),
    item.cost.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPacingRequestViews(items: GlobalPacingRequest[]): GlobalPacingRequestView[] {
  const views: GlobalPacingRequestView[] = [];
  for (const item of items) {
    views.push(toGlobalPacingRequestView(item));
  }
  return views;
}

export function sumGlobalPacingRequestView(view: GlobalPacingRequestView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedPriority + parsedBatchSize + parsedCost;
}
