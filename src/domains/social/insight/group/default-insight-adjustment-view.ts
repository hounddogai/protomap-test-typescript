import * as text from "../../../../kit/text.js";
import { DefaultInsightAdjustment } from "./default-insight-adjustment.js";

/** How screens and exports show a default insight adjustment. */
export class DefaultInsightAdjustmentView {
  codeText: string;
  title: string;
  unitText: string;
  version: string;
  category: string;
  segment: string;
  activeText: string;
  impressions: string;
  campaignRef: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    unitText: string,
    version: string,
    category: string,
    segment: string,
    activeText: string,
    impressions: string,
    campaignRef: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.unitText = unitText;
    this.version = version;
    this.category = category;
    this.segment = segment;
    this.activeText = activeText;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultInsightAdjustmentView(item: DefaultInsightAdjustment): DefaultInsightAdjustmentView {
  return new DefaultInsightAdjustmentView(
    item.code,
    item.title,
    item.unit,
    String(item.version),
    item.category,
    item.segment,
    `${item.active}`,
    String(item.impressions),
    item.campaignRef,
    text.truncate(item.contactEmail, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultInsightAdjustmentViews(items: DefaultInsightAdjustment[]): DefaultInsightAdjustmentView[] {
  const views: DefaultInsightAdjustmentView[] = [];
  for (const item of items) {
    views.push(toDefaultInsightAdjustmentView(item));
  }
  return views;
}

export function sumDefaultInsightAdjustmentView(view: DefaultInsightAdjustmentView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedVersion + parsedImpressions;
}
