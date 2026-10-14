import * as text from "../../../../kit/text.js";
import { LegacyCreativeTarget } from "./legacy-creative-target.js";

/** How screens and exports show a legacy creative target. */
export class LegacyCreativeTargetView {
  code: string;
  title: string;
  frequencyCap: string;
  margin: string;
  campaignRef: string;
  updatedAt: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    frequencyCap: string,
    margin: string,
    campaignRef: string,
    updatedAt: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCreativeTargetView(item: LegacyCreativeTarget): LegacyCreativeTargetView {
  return new LegacyCreativeTargetView(
    item.code,
    text.truncate(item.title, 80),
    String(item.frequencyCap),
    item.margin.toFixed(2),
    item.campaignRef,
    String(item.updatedAt),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCreativeTargetViews(items: LegacyCreativeTarget[]): LegacyCreativeTargetView[] {
  const views: LegacyCreativeTargetView[] = [];
  for (const item of items) {
    views.push(toLegacyCreativeTargetView(item));
  }
  return views;
}

export function sumLegacyCreativeTargetView(view: LegacyCreativeTargetView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedFrequencyCap + parsedMargin + parsedUpdatedAt;
}
