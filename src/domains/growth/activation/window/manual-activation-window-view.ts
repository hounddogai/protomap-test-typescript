import * as text from "../../../../kit/text.js";
import { ManualActivationWindow } from "./manual-activation-window.js";

/** How screens and exports show a manual activation window. */
export class ManualActivationWindowView {
  codeText: string;
  name: string;
  description: string;
  checksum: string;
  maximum: string;
  sequenceText: string;
  startsAt: string;
  channel: string;
  budgetText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    description: string,
    checksum: string,
    maximum: string,
    sequenceText: string,
    startsAt: string,
    channel: string,
    budgetText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.description = description;
    this.checksum = checksum;
    this.maximum = maximum;
    this.sequenceText = sequenceText;
    this.startsAt = startsAt;
    this.channel = channel;
    this.budgetText = budgetText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toManualActivationWindowView(item: ManualActivationWindow): ManualActivationWindowView {
  return new ManualActivationWindowView(
    item.code,
    item.name,
    text.truncate(item.description, 120),
    item.checksum,
    item.maximum.toFixed(2),
    String(item.sequence),
    String(item.startsAt),
    item.channel,
    item.budget.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualActivationWindowViews(items: ManualActivationWindow[]): ManualActivationWindowView[] {
  const views: ManualActivationWindowView[] = [];
  for (const item of items) {
    views.push(toManualActivationWindowView(item));
  }
  return views;
}

export function sumManualActivationWindowView(view: ManualActivationWindowView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedMaximum + parsedSequence + parsedStartsAt;
}
