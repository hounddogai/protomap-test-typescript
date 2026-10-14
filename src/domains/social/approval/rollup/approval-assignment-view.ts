import { ApprovalAssignment } from "./approval-assignment.js";

/** How screens and exports show a approval assignment. */
export class ApprovalAssignmentView {
  code: string;
  titleText: string;
  region: string;
  retries: string;
  locale: string;
  updatedAtText: string;
  countryText: string;
  limit: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    region: string,
    retries: string,
    locale: string,
    updatedAtText: string,
    countryText: string,
    limit: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.region = region;
    this.retries = retries;
    this.locale = locale;
    this.updatedAtText = updatedAtText;
    this.countryText = countryText;
    this.limit = limit;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalAssignmentView(item: ApprovalAssignment): ApprovalAssignmentView {
  return new ApprovalAssignmentView(
    item.code,
    item.title,
    item.region,
    String(item.retries),
    item.locale,
    String(item.updatedAt),
    item.country,
    String(item.limit),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalAssignmentViews(items: ApprovalAssignment[]): ApprovalAssignmentView[] {
  const views: ApprovalAssignmentView[] = [];
  for (const item of items) {
    views.push(toApprovalAssignmentView(item));
  }
  return views;
}

export function sumApprovalAssignmentView(view: ApprovalAssignmentView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedRetries + parsedUpdatedAt + parsedLimit;
}
