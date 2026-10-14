import * as text from "../../../../kit/text.js";
import { GlobalOptOutException } from "./global-opt-out-exception.js";

/** How screens and exports show a global opt out exception. */
export class GlobalOptOutExceptionView {
  codeText: string;
  title: string;
  active: string;
  frequencyCap: string;
  discountText: string;
  limitText: string;
  approvedText: string;
  reviewerText: string;
  audienceId: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    active: string,
    frequencyCap: string,
    discountText: string,
    limitText: string,
    approvedText: string,
    reviewerText: string,
    audienceId: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.discountText = discountText;
    this.limitText = limitText;
    this.approvedText = approvedText;
    this.reviewerText = reviewerText;
    this.audienceId = audienceId;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalOptOutExceptionView(item: GlobalOptOutException): GlobalOptOutExceptionView {
  return new GlobalOptOutExceptionView(
    item.code,
    text.truncate(item.title, 40),
    `${item.active}`,
    String(item.frequencyCap),
    item.discount.toFixed(2),
    String(item.limit),
    `${item.approved}`,
    item.reviewer,
    item.audienceId,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalOptOutExceptionViews(items: GlobalOptOutException[]): GlobalOptOutExceptionView[] {
  const views: GlobalOptOutExceptionView[] = [];
  for (const item of items) {
    views.push(toGlobalOptOutExceptionView(item));
  }
  return views;
}

export function sumGlobalOptOutExceptionView(view: GlobalOptOutExceptionView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedFrequencyCap + parsedDiscount + parsedLimit;
}
