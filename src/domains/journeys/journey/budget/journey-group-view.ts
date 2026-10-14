import { JourneyGroup } from "./journey-group.js";

/** How screens and exports show a journey group. */
export class JourneyGroupView {
  code: string;
  title: string;
  retries: string;
  pinned: string;
  rateText: string;
  batchSize: string;
  score: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retries: string,
    pinned: string,
    rateText: string,
    batchSize: string,
    score: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.pinned = pinned;
    this.rateText = rateText;
    this.batchSize = batchSize;
    this.score = score;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyGroupView(item: JourneyGroup): JourneyGroupView {
  return new JourneyGroupView(
    item.code,
    item.title,
    String(item.retries),
    `${item.pinned}`,
    item.rate.toFixed(2),
    String(item.batchSize),
    item.score.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyGroupViews(items: JourneyGroup[]): JourneyGroupView[] {
  const views: JourneyGroupView[] = [];
  for (const item of items) {
    views.push(toJourneyGroupView(item));
  }
  return views;
}

export function sumJourneyGroupView(view: JourneyGroupView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedRetries + parsedRate + parsedBatchSize;
}
