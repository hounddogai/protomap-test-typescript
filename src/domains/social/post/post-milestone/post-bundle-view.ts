import * as text from "../../../../kit/text.js";
import { PostBundle } from "./post-bundle.js";

/** How screens and exports show a post bundle. */
export class PostBundleView {
  codeText: string;
  name: string;
  visibleText: string;
  batchSize: string;
  label: string;
  audienceId: string;
  rate: string;
  clicksText: string;
  countryText: string;
  createdAtText: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    visibleText: string,
    batchSize: string,
    label: string,
    audienceId: string,
    rate: string,
    clicksText: string,
    countryText: string,
    createdAtText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.visibleText = visibleText;
    this.batchSize = batchSize;
    this.label = label;
    this.audienceId = audienceId;
    this.rate = rate;
    this.clicksText = clicksText;
    this.countryText = countryText;
    this.createdAtText = createdAtText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toPostBundleView(item: PostBundle): PostBundleView {
  return new PostBundleView(
    item.code,
    item.name,
    `${item.visible}`,
    String(item.batchSize),
    text.truncate(item.label, 40),
    item.audienceId,
    item.rate.toFixed(2),
    String(item.clicks),
    item.country,
    String(item.createdAt),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostBundleViews(items: PostBundle[]): PostBundleView[] {
  const views: PostBundleView[] = [];
  for (const item of items) {
    views.push(toPostBundleView(item));
  }
  return views;
}

export function sumPostBundleView(view: PostBundleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedBatchSize + parsedRate + parsedClicks;
}
