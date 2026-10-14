import * as text from "../../../../kit/text.js";
import { CreditMapping } from "./credit-mapping.js";

/** How screens and exports show a credit mapping. */
export class CreditMappingView {
  code: string;
  name: string;
  campaignRefText: string;
  journeyIdText: string;
  durationMinutes: string;
  impressions: string;
  sequenceText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRefText: string,
    journeyIdText: string,
    durationMinutes: string,
    impressions: string,
    sequenceText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRefText = campaignRefText;
    this.journeyIdText = journeyIdText;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
    this.sequenceText = sequenceText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditMappingView(item: CreditMapping): CreditMappingView {
  return new CreditMappingView(
    item.code,
    item.name,
    item.campaignRef,
    text.truncate(item.journeyId, 120),
    String(item.durationMinutes),
    String(item.impressions),
    String(item.sequence),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditMappingViews(items: CreditMapping[]): CreditMappingView[] {
  const views: CreditMappingView[] = [];
  for (const item of items) {
    views.push(toCreditMappingView(item));
  }
  return views;
}

export function sumCreditMappingView(view: CreditMappingView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedDurationMinutes + parsedImpressions + parsedSequence;
}
