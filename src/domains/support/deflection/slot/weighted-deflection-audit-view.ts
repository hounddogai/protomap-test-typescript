import * as text from "../../../../kit/text.js";
import { WeightedDeflectionAudit } from "./weighted-deflection-audit.js";

/** How screens and exports show a weighted deflection audit. */
export class WeightedDeflectionAuditView {
  codeText: string;
  titleText: string;
  batchSize: string;
  attempts: string;
  journeyIdText: string;
  sequence: string;
  maximum: string;
  rate: string;
  endsAt: string;
  clicks: string;
  description: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    batchSize: string,
    attempts: string,
    journeyIdText: string,
    sequence: string,
    maximum: string,
    rate: string,
    endsAt: string,
    clicks: string,
    description: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.batchSize = batchSize;
    this.attempts = attempts;
    this.journeyIdText = journeyIdText;
    this.sequence = sequence;
    this.maximum = maximum;
    this.rate = rate;
    this.endsAt = endsAt;
    this.clicks = clicks;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedDeflectionAuditView(item: WeightedDeflectionAudit): WeightedDeflectionAuditView {
  return new WeightedDeflectionAuditView(
    item.code,
    item.title,
    String(item.batchSize),
    String(item.attempts),
    item.journeyId,
    String(item.sequence),
    item.maximum.toFixed(2),
    item.rate.toFixed(2),
    String(item.endsAt),
    String(item.clicks),
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedDeflectionAuditViews(items: WeightedDeflectionAudit[]): WeightedDeflectionAuditView[] {
  const views: WeightedDeflectionAuditView[] = [];
  for (const item of items) {
    views.push(toWeightedDeflectionAuditView(item));
  }
  return views;
}

export function sumWeightedDeflectionAuditView(view: WeightedDeflectionAuditView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBatchSize + parsedAttempts + parsedSequence;
}
