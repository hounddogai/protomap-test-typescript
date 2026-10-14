import * as text from "../../../../kit/text.js";
import { RegionalNudgeGroup } from "./regional-nudge-group.js";

/** How screens and exports show a regional nudge group. */
export class RegionalNudgeGroupView {
  code: string;
  title: string;
  country: string;
  externalRef: string;
  reviewer: string;
  audienceId: string;
  region: string;
  ownerIdText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    country: string,
    externalRef: string,
    reviewer: string,
    audienceId: string,
    region: string,
    ownerIdText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.externalRef = externalRef;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.region = region;
    this.ownerIdText = ownerIdText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalNudgeGroupView(item: RegionalNudgeGroup): RegionalNudgeGroupView {
  return new RegionalNudgeGroupView(
    item.code,
    text.truncate(item.title, 64),
    text.truncate(item.country, 120),
    text.truncate(item.externalRef, 40),
    text.truncate(item.reviewer, 40),
    text.truncate(item.audienceId, 40),
    item.region,
    item.ownerId,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalNudgeGroupViews(items: RegionalNudgeGroup[]): RegionalNudgeGroupView[] {
  const views: RegionalNudgeGroupView[] = [];
  for (const item of items) {
    views.push(toRegionalNudgeGroupView(item));
  }
  return views;
}

export function sumRegionalNudgeGroupView(view: RegionalNudgeGroupView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
