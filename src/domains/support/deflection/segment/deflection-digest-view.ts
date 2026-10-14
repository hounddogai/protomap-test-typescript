import * as text from "../../../../kit/text.js";
import { DeflectionDigest } from "./deflection-digest.js";

/** How screens and exports show a deflection digest. */
export class DeflectionDigestView {
  codeText: string;
  titleText: string;
  quantity: string;
  utmSource: string;
  retriesText: string;
  ownerId: string;
  country: string;
  budget: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    quantity: string,
    utmSource: string,
    retriesText: string,
    ownerId: string,
    country: string,
    budget: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.retriesText = retriesText;
    this.ownerId = ownerId;
    this.country = country;
    this.budget = budget;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionDigestView(item: DeflectionDigest): DeflectionDigestView {
  return new DeflectionDigestView(
    item.code,
    item.title,
    String(item.quantity),
    item.utmSource,
    String(item.retries),
    text.truncate(item.ownerId, 64),
    text.truncate(item.country, 80),
    item.budget.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionDigestViews(items: DeflectionDigest[]): DeflectionDigestView[] {
  const views: DeflectionDigestView[] = [];
  for (const item of items) {
    views.push(toDeflectionDigestView(item));
  }
  return views;
}

export function sumDeflectionDigestView(view: DeflectionDigestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedQuantity + parsedRetries + parsedBudget;
}
