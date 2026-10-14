import * as text from "../../../../kit/text.js";
import { WarmupProfile } from "./warmup-profile.js";

/** How screens and exports show a warmup profile. */
export class WarmupProfileView {
  code: string;
  name: string;
  rate: string;
  sequence: string;
  ratio: string;
  phoneText: string;
  retries: string;
  budget: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    sequence: string,
    ratio: string,
    phoneText: string,
    retries: string,
    budget: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.sequence = sequence;
    this.ratio = ratio;
    this.phoneText = phoneText;
    this.retries = retries;
    this.budget = budget;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupProfileView(item: WarmupProfile): WarmupProfileView {
  return new WarmupProfileView(
    item.code,
    text.truncate(item.name, 40),
    item.rate.toFixed(2),
    String(item.sequence),
    item.ratio.toFixed(2),
    item.phone,
    String(item.retries),
    item.budget.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupProfileViews(items: WarmupProfile[]): WarmupProfileView[] {
  const views: WarmupProfileView[] = [];
  for (const item of items) {
    views.push(toWarmupProfileView(item));
  }
  return views;
}

export function sumWarmupProfileView(view: WarmupProfileView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRate + parsedSequence + parsedRatio;
}
