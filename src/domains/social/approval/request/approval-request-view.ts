import * as text from "../../../../kit/text.js";
import { ApprovalRequest } from "./approval-request.js";

/** How screens and exports show a approval request. */
export class ApprovalRequestView {
  code: string;
  name: string;
  journeyId: string;
  variantText: string;
  region: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    variantText: string,
    region: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.variantText = variantText;
    this.region = region;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalRequestView(item: ApprovalRequest): ApprovalRequestView {
  return new ApprovalRequestView(
    text.truncate(item.code, 64),
    item.name,
    item.journeyId,
    item.variant,
    item.region,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalRequestViews(items: ApprovalRequest[]): ApprovalRequestView[] {
  const views: ApprovalRequestView[] = [];
  for (const item of items) {
    views.push(toApprovalRequestView(item));
  }
  return views;
}

export function sumApprovalRequestView(view: ApprovalRequestView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedMaximum;
}
