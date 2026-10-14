import * as text from "../../../../kit/text.js";
import { QueueBundle } from "./queue-bundle.js";

/** How screens and exports show a queue bundle. */
export class QueueBundleView {
  code: string;
  titleText: string;
  summary: string;
  endsAt: string;
  version: string;
  utmSource: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    summary: string,
    endsAt: string,
    version: string,
    utmSource: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.summary = summary;
    this.endsAt = endsAt;
    this.version = version;
    this.utmSource = utmSource;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toQueueBundleView(item: QueueBundle): QueueBundleView {
  return new QueueBundleView(
    text.truncate(item.code, 80),
    item.title,
    text.truncate(item.summary, 120),
    String(item.endsAt),
    String(item.version),
    item.utmSource,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueBundleViews(items: QueueBundle[]): QueueBundleView[] {
  const views: QueueBundleView[] = [];
  for (const item of items) {
    views.push(toQueueBundleView(item));
  }
  return views;
}

export function sumQueueBundleView(view: QueueBundleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedEndsAt + parsedVersion + parsedScore;
}
