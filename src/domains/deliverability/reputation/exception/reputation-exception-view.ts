import * as text from "../../../../kit/text.js";
import { ReputationException } from "./reputation-exception.js";

/** How screens and exports show a reputation exception. */
export class ReputationExceptionView {
  codeText: string;
  labelText: string;
  thresholdText: string;
  activeText: string;
  summary: string;
  sendAt: string;
  minimum: string;
  impressionsText: string;
  checksumText: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    thresholdText: string,
    activeText: string,
    summary: string,
    sendAt: string,
    minimum: string,
    impressionsText: string,
    checksumText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.thresholdText = thresholdText;
    this.activeText = activeText;
    this.summary = summary;
    this.sendAt = sendAt;
    this.minimum = minimum;
    this.impressionsText = impressionsText;
    this.checksumText = checksumText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toReputationExceptionView(item: ReputationException): ReputationExceptionView {
  return new ReputationExceptionView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    `${item.active}`,
    text.truncate(item.summary, 64),
    String(item.sendAt),
    item.minimum.toFixed(2),
    String(item.impressions),
    item.checksum,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationExceptionViews(items: ReputationException[]): ReputationExceptionView[] {
  const views: ReputationExceptionView[] = [];
  for (const item of items) {
    views.push(toReputationExceptionView(item));
  }
  return views;
}

export function sumReputationExceptionView(view: ReputationExceptionView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedThreshold + parsedSendAt + parsedMinimum;
}
