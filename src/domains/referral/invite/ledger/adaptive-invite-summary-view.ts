import * as text from "../../../../kit/text.js";
import { AdaptiveInviteSummary } from "./adaptive-invite-summary.js";

/** How screens and exports show a adaptive invite summary. */
export class AdaptiveInviteSummaryView {
  codeText: string;
  title: string;
  journeyId: string;
  locale: string;
  frequencyCap: string;
  clicksText: string;
  graceDays: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    journeyId: string,
    locale: string,
    frequencyCap: string,
    clicksText: string,
    graceDays: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.journeyId = journeyId;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.clicksText = clicksText;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveInviteSummaryView(item: AdaptiveInviteSummary): AdaptiveInviteSummaryView {
  return new AdaptiveInviteSummaryView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    text.truncate(item.journeyId, 40),
    item.locale,
    String(item.frequencyCap),
    String(item.clicks),
    String(item.graceDays),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveInviteSummaryViews(items: AdaptiveInviteSummary[]): AdaptiveInviteSummaryView[] {
  const views: AdaptiveInviteSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveInviteSummaryView(item));
  }
  return views;
}

export function sumAdaptiveInviteSummaryView(view: AdaptiveInviteSummaryView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedFrequencyCap + parsedClicks + parsedGraceDays;
}
