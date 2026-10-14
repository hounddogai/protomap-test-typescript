import * as text from "../../../../kit/text.js";
import { ActivationAudit } from "./activation-audit.js";

/** How screens and exports show a activation audit. */
export class ActivationAuditView {
  code: string;
  titleText: string;
  variantText: string;
  retries: string;
  windowDaysText: string;
  currency: string;
  contactEmail: string;
  audienceId: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    variantText: string,
    retries: string,
    windowDaysText: string,
    currency: string,
    contactEmail: string,
    audienceId: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.variantText = variantText;
    this.retries = retries;
    this.windowDaysText = windowDaysText;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.audienceId = audienceId;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toActivationAuditView(item: ActivationAudit): ActivationAuditView {
  return new ActivationAuditView(
    item.code,
    text.truncate(item.title, 80),
    item.variant,
    String(item.retries),
    String(item.windowDays),
    text.truncate(item.currency, 40),
    text.truncate(item.contactEmail, 64),
    text.truncate(item.audienceId, 64),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationAuditViews(items: ActivationAudit[]): ActivationAuditView[] {
  const views: ActivationAuditView[] = [];
  for (const item of items) {
    views.push(toActivationAuditView(item));
  }
  return views;
}

export function sumActivationAuditView(view: ActivationAuditView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRetries + parsedWindowDays + parsedMargin;
}
