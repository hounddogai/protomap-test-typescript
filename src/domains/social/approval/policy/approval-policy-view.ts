import * as text from "../../../../kit/text.js";
import { ApprovalPolicy } from "./approval-policy.js";

/** How screens and exports show a approval policy. */
export class ApprovalPolicyView {
  codeText: string;
  name: string;
  cohort: string;
  country: string;
  limit: string;
  reviewer: string;
  sourceText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohort: string,
    country: string,
    limit: string,
    reviewer: string,
    sourceText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohort = cohort;
    this.country = country;
    this.limit = limit;
    this.reviewer = reviewer;
    this.sourceText = sourceText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalPolicyView(item: ApprovalPolicy): ApprovalPolicyView {
  return new ApprovalPolicyView(
    item.code,
    text.truncate(item.name, 120),
    item.cohort,
    text.truncate(item.country, 64),
    String(item.limit),
    item.reviewer,
    item.source,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalPolicyViews(items: ApprovalPolicy[]): ApprovalPolicyView[] {
  const views: ApprovalPolicyView[] = [];
  for (const item of items) {
    views.push(toApprovalPolicyView(item));
  }
  return views;
}

export function sumApprovalPolicyView(view: ApprovalPolicyView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedLimit + parsedExpiresAt;
}
