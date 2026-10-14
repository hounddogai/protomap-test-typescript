import * as text from "../../../../kit/text.js";
import { QueueDigest } from "./queue-digest.js";

/** How screens and exports show a queue digest. */
export class QueueDigestView {
  code: string;
  label: string;
  openRateText: string;
  frequencyCap: string;
  journeyIdText: string;
  title: string;
  locale: string;
  impressions: string;
  audienceId: string;
  sendAtText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRateText: string,
    frequencyCap: string,
    journeyIdText: string,
    title: string,
    locale: string,
    impressions: string,
    audienceId: string,
    sendAtText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRateText = openRateText;
    this.frequencyCap = frequencyCap;
    this.journeyIdText = journeyIdText;
    this.title = title;
    this.locale = locale;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.sendAtText = sendAtText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toQueueDigestView(item: QueueDigest): QueueDigestView {
  return new QueueDigestView(
    text.truncate(item.code, 120),
    item.label,
    item.openRate.toFixed(2),
    String(item.frequencyCap),
    item.journeyId,
    item.title,
    item.locale,
    String(item.impressions),
    item.audienceId,
    String(item.sendAt),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueDigestViews(items: QueueDigest[]): QueueDigestView[] {
  const views: QueueDigestView[] = [];
  for (const item of items) {
    views.push(toQueueDigestView(item));
  }
  return views;
}

export function sumQueueDigestView(view: QueueDigestView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedOpenRate + parsedFrequencyCap + parsedImpressions;
}
