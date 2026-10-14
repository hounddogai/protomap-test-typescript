import * as text from "../../../../kit/text.js";
import { DefaultCohortTemplate } from "./default-cohort-template.js";

/** How screens and exports show a default cohort template. */
export class DefaultCohortTemplateView {
  code: string;
  name: string;
  unit: string;
  updatedAt: string;
  externalRef: string;
  ratio: string;
  contactEmail: string;
  attempts: string;
  openRate: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    updatedAt: string,
    externalRef: string,
    ratio: string,
    contactEmail: string,
    attempts: string,
    openRate: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.updatedAt = updatedAt;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.openRate = openRate;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCohortTemplateView(item: DefaultCohortTemplate): DefaultCohortTemplateView {
  return new DefaultCohortTemplateView(
    item.code,
    text.truncate(item.name, 80),
    text.truncate(item.unit, 120),
    String(item.updatedAt),
    item.externalRef,
    item.ratio.toFixed(2),
    item.contactEmail,
    String(item.attempts),
    item.openRate.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCohortTemplateViews(items: DefaultCohortTemplate[]): DefaultCohortTemplateView[] {
  const views: DefaultCohortTemplateView[] = [];
  for (const item of items) {
    views.push(toDefaultCohortTemplateView(item));
  }
  return views;
}

export function sumDefaultCohortTemplateView(view: DefaultCohortTemplateView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedUpdatedAt + parsedRatio + parsedAttempts;
}
