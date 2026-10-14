import * as text from "../../../../kit/text.js";
import { RollingDomainVariance } from "./rolling-domain-variance.js";

/** How screens and exports show a rolling domain variance. */
export class RollingDomainVarianceView {
  codeText: string;
  name: string;
  frequencyCapText: string;
  journeyId: string;
  impressions: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    frequencyCapText: string,
    journeyId: string,
    impressions: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.frequencyCapText = frequencyCapText;
    this.journeyId = journeyId;
    this.impressions = impressions;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toRollingDomainVarianceView(item: RollingDomainVariance): RollingDomainVarianceView {
  return new RollingDomainVarianceView(
    item.code,
    text.truncate(item.name, 40),
    String(item.frequencyCap),
    item.journeyId,
    String(item.impressions),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingDomainVarianceViews(items: RollingDomainVariance[]): RollingDomainVarianceView[] {
  const views: RollingDomainVarianceView[] = [];
  for (const item of items) {
    views.push(toRollingDomainVarianceView(item));
  }
  return views;
}

export function sumRollingDomainVarianceView(view: RollingDomainVarianceView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedFrequencyCap + parsedImpressions + parsedScore;
}
