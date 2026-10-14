import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleAudit } from "./adaptive-exit-rule-audit.js";

/** How screens and exports show a adaptive exit rule audit. */
export class AdaptiveExitRuleAuditView {
  code: string;
  titleText: string;
  retriesText: string;
  batchSizeText: string;
  createdAt: string;
  notes: string;
  channel: string;
  maximumText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    retriesText: string,
    batchSizeText: string,
    createdAt: string,
    notes: string,
    channel: string,
    maximumText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.retriesText = retriesText;
    this.batchSizeText = batchSizeText;
    this.createdAt = createdAt;
    this.notes = notes;
    this.channel = channel;
    this.maximumText = maximumText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveExitRuleAuditView(item: AdaptiveExitRuleAudit): AdaptiveExitRuleAuditView {
  return new AdaptiveExitRuleAuditView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 120),
    String(item.retries),
    String(item.batchSize),
    String(item.createdAt),
    text.truncate(item.notes, 64),
    text.truncate(item.channel, 120),
    item.maximum.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveExitRuleAuditViews(items: AdaptiveExitRuleAudit[]): AdaptiveExitRuleAuditView[] {
  const views: AdaptiveExitRuleAuditView[] = [];
  for (const item of items) {
    views.push(toAdaptiveExitRuleAuditView(item));
  }
  return views;
}

export function sumAdaptiveExitRuleAuditView(view: AdaptiveExitRuleAuditView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRetries + parsedBatchSize + parsedCreatedAt;
}
