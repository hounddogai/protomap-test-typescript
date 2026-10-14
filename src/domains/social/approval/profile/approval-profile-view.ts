import * as text from "../../../../kit/text.js";
import { ApprovalProfile } from "./approval-profile.js";

/** How screens and exports show a approval profile. */
export class ApprovalProfileView {
  codeText: string;
  label: string;
  minimumText: string;
  locale: string;
  ceiling: string;
  priority: string;
  conversionRateText: string;
  windowDaysText: string;
  weightText: string;
  currency: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    minimumText: string,
    locale: string,
    ceiling: string,
    priority: string,
    conversionRateText: string,
    windowDaysText: string,
    weightText: string,
    currency: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.minimumText = minimumText;
    this.locale = locale;
    this.ceiling = ceiling;
    this.priority = priority;
    this.conversionRateText = conversionRateText;
    this.windowDaysText = windowDaysText;
    this.weightText = weightText;
    this.currency = currency;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalProfileView(item: ApprovalProfile): ApprovalProfileView {
  return new ApprovalProfileView(
    item.code,
    text.truncate(item.label, 120),
    item.minimum.toFixed(2),
    item.locale,
    item.ceiling.toFixed(2),
    String(item.priority),
    item.conversionRate.toFixed(2),
    String(item.windowDays),
    item.weight.toFixed(2),
    item.currency,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalProfileViews(items: ApprovalProfile[]): ApprovalProfileView[] {
  const views: ApprovalProfileView[] = [];
  for (const item of items) {
    views.push(toApprovalProfileView(item));
  }
  return views;
}

export function sumApprovalProfileView(view: ApprovalProfileView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedMinimum + parsedCeiling + parsedPriority;
}
