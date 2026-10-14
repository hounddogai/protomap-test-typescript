import * as text from "../../../../kit/text.js";
import { StrictFraudCheckCheckpoint } from "./strict-fraud-check-checkpoint.js";

/** How screens and exports show a strict fraud check checkpoint. */
export class StrictFraudCheckCheckpointView {
  codeText: string;
  name: string;
  audienceId: string;
  rate: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    audienceId: string,
    rate: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.audienceId = audienceId;
    this.rate = rate;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFraudCheckCheckpointView(item: StrictFraudCheckCheckpoint): StrictFraudCheckCheckpointView {
  return new StrictFraudCheckCheckpointView(
    item.code,
    text.truncate(item.name, 80),
    item.audienceId,
    item.rate.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFraudCheckCheckpointViews(items: StrictFraudCheckCheckpoint[]): StrictFraudCheckCheckpointView[] {
  const views: StrictFraudCheckCheckpointView[] = [];
  for (const item of items) {
    views.push(toStrictFraudCheckCheckpointView(item));
  }
  return views;
}

export function sumStrictFraudCheckCheckpointView(view: StrictFraudCheckCheckpointView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
