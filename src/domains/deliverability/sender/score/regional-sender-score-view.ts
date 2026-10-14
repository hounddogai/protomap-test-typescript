import * as text from "../../../../kit/text.js";
import { RegionalSenderScore } from "./regional-sender-score.js";

/** How screens and exports show a regional sender score. */
export class RegionalSenderScoreView {
  code: string;
  nameText: string;
  limitText: string;
  pinned: string;
  frequencyCapText: string;
  descriptionText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    limitText: string,
    pinned: string,
    frequencyCapText: string,
    descriptionText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.limitText = limitText;
    this.pinned = pinned;
    this.frequencyCapText = frequencyCapText;
    this.descriptionText = descriptionText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSenderScoreView(item: RegionalSenderScore): RegionalSenderScoreView {
  return new RegionalSenderScoreView(
    item.code,
    text.truncate(item.name, 120),
    String(item.limit),
    `${item.pinned}`,
    String(item.frequencyCap),
    item.description,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSenderScoreViews(items: RegionalSenderScore[]): RegionalSenderScoreView[] {
  const views: RegionalSenderScoreView[] = [];
  for (const item of items) {
    views.push(toRegionalSenderScoreView(item));
  }
  return views;
}

export function sumRegionalSenderScoreView(view: RegionalSenderScoreView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedLimit + parsedFrequencyCap;
}
