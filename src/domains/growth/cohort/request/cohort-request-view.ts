import { CohortRequest } from "./cohort-request.js";

/** How screens and exports show a cohort request. */
export class CohortRequestView {
  code: string;
  name: string;
  attempts: string;
  variantText: string;
  contactEmail: string;
  retries: string;
  ratioText: string;
  channel: string;
  marginText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    variantText: string,
    contactEmail: string,
    retries: string,
    ratioText: string,
    channel: string,
    marginText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.variantText = variantText;
    this.contactEmail = contactEmail;
    this.retries = retries;
    this.ratioText = ratioText;
    this.channel = channel;
    this.marginText = marginText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toCohortRequestView(item: CohortRequest): CohortRequestView {
  return new CohortRequestView(
    item.code,
    item.name,
    String(item.attempts),
    item.variant,
    item.contactEmail,
    String(item.retries),
    item.ratio.toFixed(2),
    item.channel,
    item.margin.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortRequestViews(items: CohortRequest[]): CohortRequestView[] {
  const views: CohortRequestView[] = [];
  for (const item of items) {
    views.push(toCohortRequestView(item));
  }
  return views;
}

export function sumCohortRequestView(view: CohortRequestView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedAttempts + parsedRetries + parsedRatio;
}
