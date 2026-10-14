import * as text from "../../../../kit/text.js";
import { WarmupMilestone } from "./warmup-milestone.js";

/** How screens and exports show a warmup milestone. */
export class WarmupMilestoneView {
  codeText: string;
  labelText: string;
  frequencyCap: string;
  limit: string;
  externalRef: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    frequencyCap: string,
    limit: string,
    externalRef: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.externalRef = externalRef;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupMilestoneView(item: WarmupMilestone): WarmupMilestoneView {
  return new WarmupMilestoneView(
    item.code,
    text.truncate(item.label, 80),
    String(item.frequencyCap),
    String(item.limit),
    text.truncate(item.externalRef, 40),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupMilestoneViews(items: WarmupMilestone[]): WarmupMilestoneView[] {
  const views: WarmupMilestoneView[] = [];
  for (const item of items) {
    views.push(toWarmupMilestoneView(item));
  }
  return views;
}

export function sumWarmupMilestoneView(view: WarmupMilestoneView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedFrequencyCap + parsedLimit;
}
