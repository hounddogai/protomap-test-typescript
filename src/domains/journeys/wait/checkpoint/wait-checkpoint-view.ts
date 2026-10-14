import { WaitCheckpoint } from "./wait-checkpoint.js";

/** How screens and exports show a wait checkpoint. */
export class WaitCheckpointView {
  code: string;
  labelText: string;
  attempts: string;
  journeyId: string;
  active: string;
  channel: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    attempts: string,
    journeyId: string,
    active: string,
    channel: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.attempts = attempts;
    this.journeyId = journeyId;
    this.active = active;
    this.channel = channel;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toWaitCheckpointView(item: WaitCheckpoint): WaitCheckpointView {
  return new WaitCheckpointView(
    item.code,
    item.label,
    String(item.attempts),
    item.journeyId,
    `${item.active}`,
    item.channel,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitCheckpointViews(items: WaitCheckpoint[]): WaitCheckpointView[] {
  const views: WaitCheckpointView[] = [];
  for (const item of items) {
    views.push(toWaitCheckpointView(item));
  }
  return views;
}

export function sumWaitCheckpointView(view: WaitCheckpointView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedAttempts + parsedCapacity;
}
