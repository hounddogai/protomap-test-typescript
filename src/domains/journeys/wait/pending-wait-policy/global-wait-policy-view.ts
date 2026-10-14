import * as text from "../../../../kit/text.js";
import { GlobalWaitPolicy } from "./global-wait-policy.js";

/** How screens and exports show a global wait policy. */
export class GlobalWaitPolicyView {
  codeText: string;
  labelText: string;
  retries: string;
  phone: string;
  visibleText: string;
  segmentText: string;
  batchSizeText: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    retries: string,
    phone: string,
    visibleText: string,
    segmentText: string,
    batchSizeText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.retries = retries;
    this.phone = phone;
    this.visibleText = visibleText;
    this.segmentText = segmentText;
    this.batchSizeText = batchSizeText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalWaitPolicyView(item: GlobalWaitPolicy): GlobalWaitPolicyView {
  return new GlobalWaitPolicyView(
    text.truncate(item.code, 64),
    item.label,
    String(item.retries),
    item.phone,
    `${item.visible}`,
    item.segment,
    String(item.batchSize),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalWaitPolicyViews(items: GlobalWaitPolicy[]): GlobalWaitPolicyView[] {
  const views: GlobalWaitPolicyView[] = [];
  for (const item of items) {
    views.push(toGlobalWaitPolicyView(item));
  }
  return views;
}

export function sumGlobalWaitPolicyView(view: GlobalWaitPolicyView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedRetries + parsedBatchSize + parsedCost;
}
