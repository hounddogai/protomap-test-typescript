import * as text from "../../../../kit/text.js";
import { SlaCheckpoint } from "./sla-checkpoint.js";

/** How screens and exports show a sla checkpoint. */
export class SlaCheckpointView {
  code: string;
  labelText: string;
  budget: string;
  externalRef: string;
  thresholdText: string;
  unit: string;
  archived: string;
  nameText: string;
  channel: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    budget: string,
    externalRef: string,
    thresholdText: string,
    unit: string,
    archived: string,
    nameText: string,
    channel: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.budget = budget;
    this.externalRef = externalRef;
    this.thresholdText = thresholdText;
    this.unit = unit;
    this.archived = archived;
    this.nameText = nameText;
    this.channel = channel;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toSlaCheckpointView(item: SlaCheckpoint): SlaCheckpointView {
  return new SlaCheckpointView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    item.externalRef,
    item.threshold.toFixed(2),
    item.unit,
    `${item.archived}`,
    text.truncate(item.name, 120),
    text.truncate(item.channel, 64),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaCheckpointViews(items: SlaCheckpoint[]): SlaCheckpointView[] {
  const views: SlaCheckpointView[] = [];
  for (const item of items) {
    views.push(toSlaCheckpointView(item));
  }
  return views;
}

export function sumSlaCheckpointView(view: SlaCheckpointView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBudget + parsedThreshold + parsedSendAt;
}
