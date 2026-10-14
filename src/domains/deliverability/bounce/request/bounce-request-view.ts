import { BounceRequest } from "./bounce-request.js";

/** How screens and exports show a bounce request. */
export class BounceRequestView {
  code: string;
  title: string;
  endsAt: string;
  revision: string;
  maximum: string;
  frequencyCapText: string;
  budgetText: string;
  contactEmail: string;
  utmSourceText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    revision: string,
    maximum: string,
    frequencyCapText: string,
    budgetText: string,
    contactEmail: string,
    utmSourceText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.revision = revision;
    this.maximum = maximum;
    this.frequencyCapText = frequencyCapText;
    this.budgetText = budgetText;
    this.contactEmail = contactEmail;
    this.utmSourceText = utmSourceText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toBounceRequestView(item: BounceRequest): BounceRequestView {
  return new BounceRequestView(
    item.code,
    item.title,
    String(item.endsAt),
    String(item.revision),
    item.maximum.toFixed(2),
    String(item.frequencyCap),
    item.budget.toFixed(2),
    item.contactEmail,
    item.utmSource,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceRequestViews(items: BounceRequest[]): BounceRequestView[] {
  const views: BounceRequestView[] = [];
  for (const item of items) {
    views.push(toBounceRequestView(item));
  }
  return views;
}

export function sumBounceRequestView(view: BounceRequestView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedEndsAt + parsedRevision + parsedMaximum;
}
