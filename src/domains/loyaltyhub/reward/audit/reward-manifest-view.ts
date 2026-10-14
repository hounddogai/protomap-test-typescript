import * as text from "../../../../kit/text.js";
import { RewardManifest } from "./reward-manifest.js";

/** How screens and exports show a reward manifest. */
export class RewardManifestView {
  code: string;
  title: string;
  country: string;
  source: string;
  archived: string;
  batchSize: string;
  campaignRef: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    country: string,
    source: string,
    archived: string,
    batchSize: string,
    campaignRef: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.source = source;
    this.archived = archived;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toRewardManifestView(item: RewardManifest): RewardManifestView {
  return new RewardManifestView(
    item.code,
    text.truncate(item.title, 120),
    item.country,
    text.truncate(item.source, 40),
    `${item.archived}`,
    String(item.batchSize),
    text.truncate(item.campaignRef, 40),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardManifestViews(items: RewardManifest[]): RewardManifestView[] {
  const views: RewardManifestView[] = [];
  for (const item of items) {
    views.push(toRewardManifestView(item));
  }
  return views;
}

export function sumRewardManifestView(view: RewardManifestView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBatchSize + parsedRetries;
}
