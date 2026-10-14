import * as text from "../../../../kit/text.js";
import { PendingDeflectionEntry } from "./pending-deflection-entry.js";

/** How screens and exports show a pending deflection entry. */
export class PendingDeflectionEntryView {
  code: string;
  name: string;
  updatedAt: string;
  openRateText: string;
  label: string;
  scoreText: string;
  phone: string;
  retriesText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    openRateText: string,
    label: string,
    scoreText: string,
    phone: string,
    retriesText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.openRateText = openRateText;
    this.label = label;
    this.scoreText = scoreText;
    this.phone = phone;
    this.retriesText = retriesText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingDeflectionEntryView(item: PendingDeflectionEntry): PendingDeflectionEntryView {
  return new PendingDeflectionEntryView(
    text.truncate(item.code, 120),
    item.name,
    String(item.updatedAt),
    item.openRate.toFixed(2),
    item.label,
    item.score.toFixed(2),
    item.phone,
    String(item.retries),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingDeflectionEntryViews(items: PendingDeflectionEntry[]): PendingDeflectionEntryView[] {
  const views: PendingDeflectionEntryView[] = [];
  for (const item of items) {
    views.push(toPendingDeflectionEntryView(item));
  }
  return views;
}

export function sumPendingDeflectionEntryView(view: PendingDeflectionEntryView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedUpdatedAt + parsedOpenRate + parsedScore;
}
