import * as text from "../../../../kit/text.js";
import { StrictFunnelBundle } from "./strict-funnel-bundle.js";

/** How screens and exports show a strict funnel bundle. */
export class StrictFunnelBundleView {
  code: string;
  titleText: string;
  cohort: string;
  description: string;
  impressions: string;
  summary: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    cohort: string,
    description: string,
    impressions: string,
    summary: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.cohort = cohort;
    this.description = description;
    this.impressions = impressions;
    this.summary = summary;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFunnelBundleView(item: StrictFunnelBundle): StrictFunnelBundleView {
  return new StrictFunnelBundleView(
    text.truncate(item.code, 120),
    item.title,
    item.cohort,
    item.description,
    String(item.impressions),
    item.summary,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFunnelBundleViews(items: StrictFunnelBundle[]): StrictFunnelBundleView[] {
  const views: StrictFunnelBundleView[] = [];
  for (const item of items) {
    views.push(toStrictFunnelBundleView(item));
  }
  return views;
}

export function sumStrictFunnelBundleView(view: StrictFunnelBundleView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedImpressions;
}
