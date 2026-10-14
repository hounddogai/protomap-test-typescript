import * as text from "../../../../kit/text.js";
import { BatchedPostTemplate } from "./batched-post-template.js";

/** How screens and exports show a batched post template. */
export class BatchedPostTemplateView {
  codeText: string;
  titleText: string;
  durationMinutesText: string;
  externalRef: string;
  expiresAtText: string;
  audienceId: string;
  labelText: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    durationMinutesText: string,
    externalRef: string,
    expiresAtText: string,
    audienceId: string,
    labelText: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.durationMinutesText = durationMinutesText;
    this.externalRef = externalRef;
    this.expiresAtText = expiresAtText;
    this.audienceId = audienceId;
    this.labelText = labelText;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPostTemplateView(item: BatchedPostTemplate): BatchedPostTemplateView {
  return new BatchedPostTemplateView(
    item.code,
    text.truncate(item.title, 40),
    String(item.durationMinutes),
    item.externalRef,
    String(item.expiresAt),
    text.truncate(item.audienceId, 64),
    text.truncate(item.label, 80),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPostTemplateViews(items: BatchedPostTemplate[]): BatchedPostTemplateView[] {
  const views: BatchedPostTemplateView[] = [];
  for (const item of items) {
    views.push(toBatchedPostTemplateView(item));
  }
  return views;
}

export function sumBatchedPostTemplateView(view: BatchedPostTemplateView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedDurationMinutes + parsedExpiresAt + parsedWindowDays;
}
