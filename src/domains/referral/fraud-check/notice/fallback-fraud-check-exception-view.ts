import * as text from "../../../../kit/text.js";
import { FallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

/** How screens and exports show a fallback fraud check exception. */
export class FallbackFraudCheckExceptionView {
  code: string;
  label: string;
  cohortText: string;
  utmSource: string;
  countryText: string;
  createdAtText: string;
  description: string;
  audienceId: string;
  notesText: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohortText: string,
    utmSource: string,
    countryText: string,
    createdAtText: string,
    description: string,
    audienceId: string,
    notesText: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohortText = cohortText;
    this.utmSource = utmSource;
    this.countryText = countryText;
    this.createdAtText = createdAtText;
    this.description = description;
    this.audienceId = audienceId;
    this.notesText = notesText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFraudCheckExceptionView(item: FallbackFraudCheckException): FallbackFraudCheckExceptionView {
  return new FallbackFraudCheckExceptionView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.cohort, 80),
    item.utmSource,
    item.country,
    String(item.createdAt),
    item.description,
    item.audienceId,
    item.notes,
    text.truncate(item.source, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFraudCheckExceptionViews(items: FallbackFraudCheckException[]): FallbackFraudCheckExceptionView[] {
  const views: FallbackFraudCheckExceptionView[] = [];
  for (const item of items) {
    views.push(toFallbackFraudCheckExceptionView(item));
  }
  return views;
}

export function sumFallbackFraudCheckExceptionView(view: FallbackFraudCheckExceptionView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedCreatedAt;
}
