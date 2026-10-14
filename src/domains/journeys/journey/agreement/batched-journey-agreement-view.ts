import * as text from "../../../../kit/text.js";
import { BatchedJourneyAgreement } from "./batched-journey-agreement.js";

/** How screens and exports show a batched journey agreement. */
export class BatchedJourneyAgreementView {
  code: string;
  name: string;
  country: string;
  attempts: string;
  timezone: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    attempts: string,
    timezone: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.attempts = attempts;
    this.timezone = timezone;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedJourneyAgreementView(item: BatchedJourneyAgreement): BatchedJourneyAgreementView {
  return new BatchedJourneyAgreementView(
    item.code,
    text.truncate(item.name, 64),
    item.country,
    String(item.attempts),
    item.timezone,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedJourneyAgreementViews(items: BatchedJourneyAgreement[]): BatchedJourneyAgreementView[] {
  const views: BatchedJourneyAgreementView[] = [];
  for (const item of items) {
    views.push(toBatchedJourneyAgreementView(item));
  }
  return views;
}

export function sumBatchedJourneyAgreementView(view: BatchedJourneyAgreementView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
