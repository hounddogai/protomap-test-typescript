import * as text from "../../../../kit/text.js";
import { PostClaim } from "./post-claim.js";

/** How screens and exports show a post claim. */
export class PostClaimView {
  code: string;
  label: string;
  version: string;
  clicks: string;
  batchSize: string;
  campaignRefText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    clicks: string,
    batchSize: string,
    campaignRefText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.clicks = clicks;
    this.batchSize = batchSize;
    this.campaignRefText = campaignRefText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toPostClaimView(item: PostClaim): PostClaimView {
  return new PostClaimView(
    item.code,
    text.truncate(item.label, 64),
    String(item.version),
    String(item.clicks),
    String(item.batchSize),
    text.truncate(item.campaignRef, 80),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostClaimViews(items: PostClaim[]): PostClaimView[] {
  const views: PostClaimView[] = [];
  for (const item of items) {
    views.push(toPostClaimView(item));
  }
  return views;
}

export function sumPostClaimView(view: PostClaimView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedVersion + parsedClicks + parsedBatchSize;
}
