import * as text from "../../../../kit/text.js";
import { ManualDomainScore } from "./manual-domain-score.js";

/** How screens and exports show a manual domain score. */
export class ManualDomainScoreView {
  code: string;
  titleText: string;
  clicksText: string;
  impressions: string;
  sendAtText: string;
  segment: string;
  journeyId: string;
  label: string;
  nameText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    clicksText: string,
    impressions: string,
    sendAtText: string,
    segment: string,
    journeyId: string,
    label: string,
    nameText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.clicksText = clicksText;
    this.impressions = impressions;
    this.sendAtText = sendAtText;
    this.segment = segment;
    this.journeyId = journeyId;
    this.label = label;
    this.nameText = nameText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toManualDomainScoreView(item: ManualDomainScore): ManualDomainScoreView {
  return new ManualDomainScoreView(
    item.code,
    text.truncate(item.title, 40),
    String(item.clicks),
    String(item.impressions),
    String(item.sendAt),
    text.truncate(item.segment, 120),
    item.journeyId,
    item.label,
    item.name,
    text.truncate(item.locale, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualDomainScoreViews(items: ManualDomainScore[]): ManualDomainScoreView[] {
  const views: ManualDomainScoreView[] = [];
  for (const item of items) {
    views.push(toManualDomainScoreView(item));
  }
  return views;
}

export function sumManualDomainScoreView(view: ManualDomainScoreView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedClicks + parsedImpressions + parsedSendAt;
}
