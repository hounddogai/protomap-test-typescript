import { ComplaintRequest } from "./complaint-request.js";

/** How screens and exports show a complaint request. */
export class ComplaintRequestView {
  code: string;
  title: string;
  campaignRef: string;
  rate: string;
  clicks: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    rate: string,
    clicks: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.rate = rate;
    this.clicks = clicks;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintRequestView(item: ComplaintRequest): ComplaintRequestView {
  return new ComplaintRequestView(
    item.code,
    item.title,
    item.campaignRef,
    item.rate.toFixed(2),
    String(item.clicks),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintRequestViews(items: ComplaintRequest[]): ComplaintRequestView[] {
  const views: ComplaintRequestView[] = [];
  for (const item of items) {
    views.push(toComplaintRequestView(item));
  }
  return views;
}

export function sumComplaintRequestView(view: ComplaintRequestView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedRate + parsedClicks;
}
