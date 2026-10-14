import * as text from "../../../../kit/text.js";
import { StrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

/** How screens and exports show a strict flight checkpoint. */
export class StrictFlightCheckpointView {
  codeText: string;
  name: string;
  endsAt: string;
  amount: string;
  frequencyCap: string;
  startsAtText: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    endsAt: string,
    amount: string,
    frequencyCap: string,
    startsAtText: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.endsAt = endsAt;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.startsAtText = startsAtText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFlightCheckpointView(item: StrictFlightCheckpoint): StrictFlightCheckpointView {
  return new StrictFlightCheckpointView(
    item.code,
    text.truncate(item.name, 80),
    String(item.endsAt),
    item.amount.toFixed(2),
    String(item.frequencyCap),
    String(item.startsAt),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFlightCheckpointViews(items: StrictFlightCheckpoint[]): StrictFlightCheckpointView[] {
  const views: StrictFlightCheckpointView[] = [];
  for (const item of items) {
    views.push(toStrictFlightCheckpointView(item));
  }
  return views;
}

export function sumStrictFlightCheckpointView(view: StrictFlightCheckpointView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedEndsAt + parsedAmount + parsedFrequencyCap;
}
