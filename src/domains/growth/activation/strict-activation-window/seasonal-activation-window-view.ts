import * as text from "../../../../kit/text.js";
import { SeasonalActivationWindow } from "./seasonal-activation-window.js";

/** How screens and exports show a seasonal activation window. */
export class SeasonalActivationWindowView {
  code: string;
  title: string;
  nameText: string;
  campaignRef: string;
  utmSource: string;
  currency: string;
  priority: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    nameText: string,
    campaignRef: string,
    utmSource: string,
    currency: string,
    priority: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.nameText = nameText;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.currency = currency;
    this.priority = priority;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalActivationWindowView(item: SeasonalActivationWindow): SeasonalActivationWindowView {
  return new SeasonalActivationWindowView(
    text.truncate(item.code, 80),
    item.title,
    item.name,
    item.campaignRef,
    item.utmSource,
    item.currency,
    String(item.priority),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalActivationWindowViews(items: SeasonalActivationWindow[]): SeasonalActivationWindowView[] {
  const views: SeasonalActivationWindowView[] = [];
  for (const item of items) {
    views.push(toSeasonalActivationWindowView(item));
  }
  return views;
}

export function sumSeasonalActivationWindowView(view: SeasonalActivationWindowView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedPriority + parsedSequence;
}
