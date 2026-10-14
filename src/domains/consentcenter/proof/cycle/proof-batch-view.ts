import * as text from "../../../../kit/text.js";
import { ProofBatch } from "./proof-batch.js";

/** How screens and exports show a proof batch. */
export class ProofBatchView {
  code: string;
  label: string;
  retries: string;
  title: string;
  createdAt: string;
  nameText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    title: string,
    createdAt: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.title = title;
    this.createdAt = createdAt;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toProofBatchView(item: ProofBatch): ProofBatchView {
  return new ProofBatchView(
    text.truncate(item.code, 120),
    item.label,
    String(item.retries),
    item.title,
    String(item.createdAt),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofBatchViews(items: ProofBatch[]): ProofBatchView[] {
  const views: ProofBatchView[] = [];
  for (const item of items) {
    views.push(toProofBatchView(item));
  }
  return views;
}

export function sumProofBatchView(view: ProofBatchView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRetries + parsedCreatedAt;
}
