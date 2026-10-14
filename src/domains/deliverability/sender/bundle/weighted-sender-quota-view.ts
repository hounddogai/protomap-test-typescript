import * as text from "../../../../kit/text.js";
import { WeightedSenderQuota } from "./weighted-sender-quota.js";

/** How screens and exports show a weighted sender quota. */
export class WeightedSenderQuotaView {
  codeText: string;
  title: string;
  sequence: string;
  externalRef: string;
  channel: string;
  maximum: string;
  archived: string;
  segment: string;
  margin: string;
  ownerId: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sequence: string,
    externalRef: string,
    channel: string,
    maximum: string,
    archived: string,
    segment: string,
    margin: string,
    ownerId: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.channel = channel;
    this.maximum = maximum;
    this.archived = archived;
    this.segment = segment;
    this.margin = margin;
    this.ownerId = ownerId;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedSenderQuotaView(item: WeightedSenderQuota): WeightedSenderQuotaView {
  return new WeightedSenderQuotaView(
    item.code,
    item.title,
    String(item.sequence),
    item.externalRef,
    item.channel,
    item.maximum.toFixed(2),
    `${item.archived}`,
    item.segment,
    item.margin.toFixed(2),
    item.ownerId,
    text.truncate(item.unit, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedSenderQuotaViews(items: WeightedSenderQuota[]): WeightedSenderQuotaView[] {
  const views: WeightedSenderQuotaView[] = [];
  for (const item of items) {
    views.push(toWeightedSenderQuotaView(item));
  }
  return views;
}

export function sumWeightedSenderQuotaView(view: WeightedSenderQuotaView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedSequence + parsedMaximum + parsedMargin;
}
