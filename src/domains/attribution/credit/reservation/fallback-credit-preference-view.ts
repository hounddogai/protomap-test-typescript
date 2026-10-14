import * as text from "../../../../kit/text.js";
import { FallbackCreditPreference } from "./fallback-credit-preference.js";

/** How screens and exports show a fallback credit preference. */
export class FallbackCreditPreferenceView {
  code: string;
  name: string;
  batchSize: string;
  unit: string;
  revision: string;
  statusLabel: string;

  constructor(code: string, name: string, batchSize: string, unit: string, revision: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.unit = unit;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreditPreferenceView(item: FallbackCreditPreference): FallbackCreditPreferenceView {
  return new FallbackCreditPreferenceView(
    item.code,
    text.truncate(item.name, 40),
    String(item.batchSize),
    item.unit,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreditPreferenceViews(items: FallbackCreditPreference[]): FallbackCreditPreferenceView[] {
  const views: FallbackCreditPreferenceView[] = [];
  for (const item of items) {
    views.push(toFallbackCreditPreferenceView(item));
  }
  return views;
}

export function sumFallbackCreditPreferenceView(view: FallbackCreditPreferenceView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBatchSize + parsedRevision;
}
