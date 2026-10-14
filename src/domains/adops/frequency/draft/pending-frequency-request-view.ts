import * as text from "../../../../kit/text.js";
import { PendingFrequencyRequest } from "./pending-frequency-request.js";

/** How screens and exports show a pending frequency request. */
export class PendingFrequencyRequestView {
  code: string;
  label: string;
  endsAt: string;
  source: string;
  channel: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAt: string,
    source: string,
    channel: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.source = source;
    this.channel = channel;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFrequencyRequestView(item: PendingFrequencyRequest): PendingFrequencyRequestView {
  return new PendingFrequencyRequestView(
    item.code,
    text.truncate(item.label, 80),
    String(item.endsAt),
    item.source,
    item.channel,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFrequencyRequestViews(items: PendingFrequencyRequest[]): PendingFrequencyRequestView[] {
  const views: PendingFrequencyRequestView[] = [];
  for (const item of items) {
    views.push(toPendingFrequencyRequestView(item));
  }
  return views;
}

export function sumPendingFrequencyRequestView(view: PendingFrequencyRequestView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedEndsAt;
}
