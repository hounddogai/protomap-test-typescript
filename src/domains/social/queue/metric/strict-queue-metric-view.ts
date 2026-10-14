import * as text from "../../../../kit/text.js";
import { StrictQueueMetric } from "./strict-queue-metric.js";

/** How screens and exports show a strict queue metric. */
export class StrictQueueMetricView {
  code: string;
  label: string;
  sequence: string;
  frequencyCap: string;
  updatedAt: string;
  durationMinutesText: string;
  cohort: string;
  channel: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequence: string,
    frequencyCap: string,
    updatedAt: string,
    durationMinutesText: string,
    cohort: string,
    channel: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.durationMinutesText = durationMinutesText;
    this.cohort = cohort;
    this.channel = channel;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toStrictQueueMetricView(item: StrictQueueMetric): StrictQueueMetricView {
  return new StrictQueueMetricView(
    item.code,
    item.label,
    String(item.sequence),
    String(item.frequencyCap),
    String(item.updatedAt),
    String(item.durationMinutes),
    item.cohort,
    text.truncate(item.channel, 64),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictQueueMetricViews(items: StrictQueueMetric[]): StrictQueueMetricView[] {
  const views: StrictQueueMetricView[] = [];
  for (const item of items) {
    views.push(toStrictQueueMetricView(item));
  }
  return views;
}

export function sumStrictQueueMetricView(view: StrictQueueMetricView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedSequence + parsedFrequencyCap + parsedUpdatedAt;
}
