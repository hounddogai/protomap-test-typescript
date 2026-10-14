import * as text from "../../../../kit/text.js";
import { AdaptiveDomainGroup } from "./adaptive-domain-group.js";

/** How screens and exports show a adaptive domain group. */
export class AdaptiveDomainGroupView {
  code: string;
  titleText: string;
  costText: string;
  ratio: string;
  updatedAt: string;
  checksum: string;
  externalRef: string;
  audienceId: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    costText: string,
    ratio: string,
    updatedAt: string,
    checksum: string,
    externalRef: string,
    audienceId: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.costText = costText;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDomainGroupView(item: AdaptiveDomainGroup): AdaptiveDomainGroupView {
  return new AdaptiveDomainGroupView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    item.ratio.toFixed(2),
    String(item.updatedAt),
    text.truncate(item.checksum, 64),
    text.truncate(item.externalRef, 40),
    text.truncate(item.audienceId, 120),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDomainGroupViews(items: AdaptiveDomainGroup[]): AdaptiveDomainGroupView[] {
  const views: AdaptiveDomainGroupView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDomainGroupView(item));
  }
  return views;
}

export function sumAdaptiveDomainGroupView(view: AdaptiveDomainGroupView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedCost + parsedRatio + parsedUpdatedAt;
}
