import * as text from "../../../../kit/text.js";
import { AdaptiveDomainScore } from "./adaptive-domain-score.js";

/** How screens and exports show a adaptive domain score. */
export class AdaptiveDomainScoreView {
  code: string;
  nameText: string;
  journeyId: string;
  sequenceText: string;
  audienceIdText: string;
  version: string;
  cost: string;
  rate: string;
  timezoneText: string;
  ceiling: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    journeyId: string,
    sequenceText: string,
    audienceIdText: string,
    version: string,
    cost: string,
    rate: string,
    timezoneText: string,
    ceiling: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.journeyId = journeyId;
    this.sequenceText = sequenceText;
    this.audienceIdText = audienceIdText;
    this.version = version;
    this.cost = cost;
    this.rate = rate;
    this.timezoneText = timezoneText;
    this.ceiling = ceiling;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDomainScoreView(item: AdaptiveDomainScore): AdaptiveDomainScoreView {
  return new AdaptiveDomainScoreView(
    item.code,
    item.name,
    item.journeyId,
    String(item.sequence),
    item.audienceId,
    String(item.version),
    item.cost.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.timezone, 120),
    item.ceiling.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDomainScoreViews(items: AdaptiveDomainScore[]): AdaptiveDomainScoreView[] {
  const views: AdaptiveDomainScoreView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDomainScoreView(item));
  }
  return views;
}

export function sumAdaptiveDomainScoreView(view: AdaptiveDomainScoreView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedSequence + parsedVersion + parsedCost;
}
