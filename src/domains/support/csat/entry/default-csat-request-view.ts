import * as text from "../../../../kit/text.js";
import { DefaultCsatRequest } from "./default-csat-request.js";

/** How screens and exports show a default csat request. */
export class DefaultCsatRequestView {
  codeText: string;
  title: string;
  durationMinutes: string;
  rate: string;
  campaignRef: string;
  reviewer: string;
  cohort: string;
  frequencyCapText: string;
  ownerId: string;
  minimumText: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    durationMinutes: string,
    rate: string,
    campaignRef: string,
    reviewer: string,
    cohort: string,
    frequencyCapText: string,
    ownerId: string,
    minimumText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.frequencyCapText = frequencyCapText;
    this.ownerId = ownerId;
    this.minimumText = minimumText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCsatRequestView(item: DefaultCsatRequest): DefaultCsatRequestView {
  return new DefaultCsatRequestView(
    text.truncate(item.code, 120),
    item.title,
    String(item.durationMinutes),
    item.rate.toFixed(2),
    item.campaignRef,
    item.reviewer,
    item.cohort,
    String(item.frequencyCap),
    item.ownerId,
    item.minimum.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCsatRequestViews(items: DefaultCsatRequest[]): DefaultCsatRequestView[] {
  const views: DefaultCsatRequestView[] = [];
  for (const item of items) {
    views.push(toDefaultCsatRequestView(item));
  }
  return views;
}

export function sumDefaultCsatRequestView(view: DefaultCsatRequestView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedDurationMinutes + parsedRate + parsedFrequencyCap;
}
