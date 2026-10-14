import * as text from "../../../../kit/text.js";
import { ComplaintOverride } from "./complaint-override.js";

/** How screens and exports show a complaint override. */
export class ComplaintOverrideView {
  code: string;
  labelText: string;
  checksum: string;
  campaignRefText: string;
  externalRef: string;
  visible: string;
  frequencyCap: string;
  score: string;
  clicks: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    checksum: string,
    campaignRefText: string,
    externalRef: string,
    visible: string,
    frequencyCap: string,
    score: string,
    clicks: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.checksum = checksum;
    this.campaignRefText = campaignRefText;
    this.externalRef = externalRef;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintOverrideView(item: ComplaintOverride): ComplaintOverrideView {
  return new ComplaintOverrideView(
    text.truncate(item.code, 64),
    item.label,
    item.checksum,
    item.campaignRef,
    item.externalRef,
    `${item.visible}`,
    String(item.frequencyCap),
    item.score.toFixed(2),
    String(item.clicks),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintOverrideViews(items: ComplaintOverride[]): ComplaintOverrideView[] {
  const views: ComplaintOverrideView[] = [];
  for (const item of items) {
    views.push(toComplaintOverrideView(item));
  }
  return views;
}

export function sumComplaintOverrideView(view: ComplaintOverrideView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedFrequencyCap + parsedScore + parsedClicks;
}
