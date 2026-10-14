import * as text from "../../../../kit/text.js";
import { BadgeMapping } from "./badge-mapping.js";

/** How screens and exports show a badge mapping. */
export class BadgeMappingView {
  codeText: string;
  label: string;
  frequencyCap: string;
  activeText: string;
  channel: string;
  retries: string;
  localeText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    frequencyCap: string,
    activeText: string,
    channel: string,
    retries: string,
    localeText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.activeText = activeText;
    this.channel = channel;
    this.retries = retries;
    this.localeText = localeText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeMappingView(item: BadgeMapping): BadgeMappingView {
  return new BadgeMappingView(
    text.truncate(item.code, 40),
    item.label,
    String(item.frequencyCap),
    `${item.active}`,
    item.channel,
    String(item.retries),
    item.locale,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeMappingViews(items: BadgeMapping[]): BadgeMappingView[] {
  const views: BadgeMappingView[] = [];
  for (const item of items) {
    views.push(toBadgeMappingView(item));
  }
  return views;
}

export function sumBadgeMappingView(view: BadgeMappingView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedFrequencyCap + parsedRetries + parsedThreshold;
}
