import * as text from "../../../../kit/text.js";
import { ReputationMapping } from "./reputation-mapping.js";

/** How screens and exports show a reputation mapping. */
export class ReputationMappingView {
  codeText: string;
  nameText: string;
  graceDays: string;
  threshold: string;
  locale: string;
  contactEmailText: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    graceDays: string,
    threshold: string,
    locale: string,
    contactEmailText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.graceDays = graceDays;
    this.threshold = threshold;
    this.locale = locale;
    this.contactEmailText = contactEmailText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toReputationMappingView(item: ReputationMapping): ReputationMappingView {
  return new ReputationMappingView(
    item.code,
    item.name,
    String(item.graceDays),
    item.threshold.toFixed(2),
    text.truncate(item.locale, 120),
    item.contactEmail,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationMappingViews(items: ReputationMapping[]): ReputationMappingView[] {
  const views: ReputationMappingView[] = [];
  for (const item of items) {
    views.push(toReputationMappingView(item));
  }
  return views;
}

export function sumReputationMappingView(view: ReputationMappingView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedGraceDays + parsedThreshold;
}
