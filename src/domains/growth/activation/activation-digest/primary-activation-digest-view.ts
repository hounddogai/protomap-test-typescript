import { PrimaryActivationDigest } from "./primary-activation-digest.js";

/** How screens and exports show a primary activation digest. */
export class PrimaryActivationDigestView {
  code: string;
  title: string;
  createdAtText: string;
  frequencyCap: string;
  budget: string;
  rate: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    createdAtText: string,
    frequencyCap: string,
    budget: string,
    rate: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.createdAtText = createdAtText;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.rate = rate;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryActivationDigestView(item: PrimaryActivationDigest): PrimaryActivationDigestView {
  return new PrimaryActivationDigestView(
    item.code,
    item.title,
    String(item.createdAt),
    String(item.frequencyCap),
    item.budget.toFixed(2),
    item.rate.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryActivationDigestViews(items: PrimaryActivationDigest[]): PrimaryActivationDigestView[] {
  const views: PrimaryActivationDigestView[] = [];
  for (const item of items) {
    views.push(toPrimaryActivationDigestView(item));
  }
  return views;
}

export function sumPrimaryActivationDigestView(view: PrimaryActivationDigestView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCreatedAt + parsedFrequencyCap + parsedBudget;
}
