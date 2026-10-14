import * as text from "../../../../kit/text.js";
import { ComplaintProfile } from "./complaint-profile.js";

/** How screens and exports show a complaint profile. */
export class ComplaintProfileView {
  codeText: string;
  titleText: string;
  pinned: string;
  openRate: string;
  clicks: string;
  frequencyCap: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    pinned: string,
    openRate: string,
    clicks: string,
    frequencyCap: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.pinned = pinned;
    this.openRate = openRate;
    this.clicks = clicks;
    this.frequencyCap = frequencyCap;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintProfileView(item: ComplaintProfile): ComplaintProfileView {
  return new ComplaintProfileView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    `${item.pinned}`,
    item.openRate.toFixed(2),
    String(item.clicks),
    String(item.frequencyCap),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintProfileViews(items: ComplaintProfile[]): ComplaintProfileView[] {
  const views: ComplaintProfileView[] = [];
  for (const item of items) {
    views.push(toComplaintProfileView(item));
  }
  return views;
}

export function sumComplaintProfileView(view: ComplaintProfileView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedOpenRate + parsedClicks + parsedFrequencyCap;
}
