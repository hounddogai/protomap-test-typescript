import { InviteCheckpoint } from "./invite-checkpoint.js";

/** How screens and exports show a invite checkpoint. */
export class InviteCheckpointView {
  code: string;
  label: string;
  frequencyCap: string;
  startsAt: string;
  budget: string;
  retriesText: string;
  minimum: string;
  channel: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    startsAt: string,
    budget: string,
    retriesText: string,
    minimum: string,
    channel: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.startsAt = startsAt;
    this.budget = budget;
    this.retriesText = retriesText;
    this.minimum = minimum;
    this.channel = channel;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toInviteCheckpointView(item: InviteCheckpoint): InviteCheckpointView {
  return new InviteCheckpointView(
    item.code,
    item.label,
    String(item.frequencyCap),
    String(item.startsAt),
    item.budget.toFixed(2),
    String(item.retries),
    item.minimum.toFixed(2),
    item.channel,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteCheckpointViews(items: InviteCheckpoint[]): InviteCheckpointView[] {
  const views: InviteCheckpointView[] = [];
  for (const item of items) {
    views.push(toInviteCheckpointView(item));
  }
  return views;
}

export function sumInviteCheckpointView(view: InviteCheckpointView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFrequencyCap + parsedStartsAt + parsedBudget;
}
