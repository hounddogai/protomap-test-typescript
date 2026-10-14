import * as text from "../../../../kit/text.js";
import { WeightedBranchProfile } from "./weighted-branch-profile.js";

/** How screens and exports show a weighted branch profile. */
export class WeightedBranchProfileView {
  code: string;
  title: string;
  cohort: string;
  retriesText: string;
  utmSourceText: string;
  description: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohort: string,
    retriesText: string,
    utmSourceText: string,
    description: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.retriesText = retriesText;
    this.utmSourceText = utmSourceText;
    this.description = description;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBranchProfileView(item: WeightedBranchProfile): WeightedBranchProfileView {
  return new WeightedBranchProfileView(
    item.code,
    text.truncate(item.title, 64),
    item.cohort,
    String(item.retries),
    item.utmSource,
    item.description,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBranchProfileViews(items: WeightedBranchProfile[]): WeightedBranchProfileView[] {
  const views: WeightedBranchProfileView[] = [];
  for (const item of items) {
    views.push(toWeightedBranchProfileView(item));
  }
  return views;
}

export function sumWeightedBranchProfileView(view: WeightedBranchProfileView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedRetries + parsedSendAt;
}
