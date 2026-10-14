import * as text from "../../../../kit/text.js";
import { RollingBranchVariance } from "./rolling-branch-variance.js";

/** How screens and exports show a rolling branch variance. */
export class RollingBranchVarianceView {
  code: string;
  title: string;
  archivedText: string;
  startsAtText: string;
  channel: string;
  ownerId: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archivedText: string,
    startsAtText: string,
    channel: string,
    ownerId: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archivedText = archivedText;
    this.startsAtText = startsAtText;
    this.channel = channel;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBranchVarianceView(item: RollingBranchVariance): RollingBranchVarianceView {
  return new RollingBranchVarianceView(
    item.code,
    item.title,
    `${item.archived}`,
    String(item.startsAt),
    item.channel,
    text.truncate(item.ownerId, 80),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBranchVarianceViews(items: RollingBranchVariance[]): RollingBranchVarianceView[] {
  const views: RollingBranchVarianceView[] = [];
  for (const item of items) {
    views.push(toRollingBranchVarianceView(item));
  }
  return views;
}

export function sumRollingBranchVarianceView(view: RollingBranchVarianceView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedStartsAt + parsedBatchSize;
}
