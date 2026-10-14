import * as text from "../../../../kit/text.js";
import { BatchedWaitPolicy } from "./batched-wait-policy.js";

/** How screens and exports show a batched wait policy. */
export class BatchedWaitPolicyView {
  code: string;
  title: string;
  utmSource: string;
  summary: string;
  phone: string;
  label: string;
  approved: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    summary: string,
    phone: string,
    label: string,
    approved: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.summary = summary;
    this.phone = phone;
    this.label = label;
    this.approved = approved;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWaitPolicyView(item: BatchedWaitPolicy): BatchedWaitPolicyView {
  return new BatchedWaitPolicyView(
    text.truncate(item.code, 64),
    item.title,
    text.truncate(item.utmSource, 40),
    item.summary,
    text.truncate(item.phone, 120),
    item.label,
    `${item.approved}`,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWaitPolicyViews(items: BatchedWaitPolicy[]): BatchedWaitPolicyView[] {
  const views: BatchedWaitPolicyView[] = [];
  for (const item of items) {
    views.push(toBatchedWaitPolicyView(item));
  }
  return views;
}

export function sumBatchedWaitPolicyView(view: BatchedWaitPolicyView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
