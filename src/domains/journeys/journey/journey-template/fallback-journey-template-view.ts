import * as text from "../../../../kit/text.js";
import { FallbackJourneyTemplate } from "./fallback-journey-template.js";

/** How screens and exports show a fallback journey template. */
export class FallbackJourneyTemplateView {
  code: string;
  titleText: string;
  utmSource: string;
  segment: string;
  ceilingText: string;
  countryText: string;
  audienceId: string;
  journeyId: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    utmSource: string,
    segment: string,
    ceilingText: string,
    countryText: string,
    audienceId: string,
    journeyId: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.utmSource = utmSource;
    this.segment = segment;
    this.ceilingText = ceilingText;
    this.countryText = countryText;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackJourneyTemplateView(item: FallbackJourneyTemplate): FallbackJourneyTemplateView {
  return new FallbackJourneyTemplateView(
    item.code,
    item.title,
    item.utmSource,
    text.truncate(item.segment, 40),
    item.ceiling.toFixed(2),
    item.country,
    item.audienceId,
    item.journeyId,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackJourneyTemplateViews(items: FallbackJourneyTemplate[]): FallbackJourneyTemplateView[] {
  const views: FallbackJourneyTemplateView[] = [];
  for (const item of items) {
    views.push(toFallbackJourneyTemplateView(item));
  }
  return views;
}

export function sumFallbackJourneyTemplateView(view: FallbackJourneyTemplateView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedCeiling + parsedImpressions;
}
