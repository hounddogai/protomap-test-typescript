import * as text from "../../../../kit/text.js";
import { ActivationEstimate } from "./activation-estimate.js";

/** How screens and exports show a activation estimate. */
export class ActivationEstimateView {
  code: string;
  name: string;
  endsAt: string;
  attempts: string;
  batchSizeText: string;
  expiresAt: string;
  archived: string;
  checksum: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    endsAt: string,
    attempts: string,
    batchSizeText: string,
    expiresAt: string,
    archived: string,
    checksum: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.attempts = attempts;
    this.batchSizeText = batchSizeText;
    this.expiresAt = expiresAt;
    this.archived = archived;
    this.checksum = checksum;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toActivationEstimateView(item: ActivationEstimate): ActivationEstimateView {
  return new ActivationEstimateView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    String(item.endsAt),
    String(item.attempts),
    String(item.batchSize),
    String(item.expiresAt),
    `${item.archived}`,
    item.checksum,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationEstimateViews(items: ActivationEstimate[]): ActivationEstimateView[] {
  const views: ActivationEstimateView[] = [];
  for (const item of items) {
    views.push(toActivationEstimateView(item));
  }
  return views;
}

export function sumActivationEstimateView(view: ActivationEstimateView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedEndsAt + parsedAttempts + parsedBatchSize;
}
