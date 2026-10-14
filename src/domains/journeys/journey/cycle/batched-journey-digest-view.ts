import * as text from "../../../../kit/text.js";
import { BatchedJourneyDigest } from "./batched-journey-digest.js";

/** How screens and exports show a batched journey digest. */
export class BatchedJourneyDigestView {
  code: string;
  labelText: string;
  reviewerText: string;
  frequencyCap: string;
  phone: string;
  audienceIdText: string;
  impressions: string;
  externalRefText: string;
  retries: string;
  summary: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    reviewerText: string,
    frequencyCap: string,
    phone: string,
    audienceIdText: string,
    impressions: string,
    externalRefText: string,
    retries: string,
    summary: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.reviewerText = reviewerText;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.audienceIdText = audienceIdText;
    this.impressions = impressions;
    this.externalRefText = externalRefText;
    this.retries = retries;
    this.summary = summary;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedJourneyDigestView(item: BatchedJourneyDigest): BatchedJourneyDigestView {
  return new BatchedJourneyDigestView(
    item.code,
    item.label,
    item.reviewer,
    String(item.frequencyCap),
    text.truncate(item.phone, 40),
    text.truncate(item.audienceId, 120),
    String(item.impressions),
    item.externalRef,
    String(item.retries),
    text.truncate(item.summary, 64),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedJourneyDigestViews(items: BatchedJourneyDigest[]): BatchedJourneyDigestView[] {
  const views: BatchedJourneyDigestView[] = [];
  for (const item of items) {
    views.push(toBatchedJourneyDigestView(item));
  }
  return views;
}

export function sumBatchedJourneyDigestView(view: BatchedJourneyDigestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedFrequencyCap + parsedImpressions + parsedRetries;
}
