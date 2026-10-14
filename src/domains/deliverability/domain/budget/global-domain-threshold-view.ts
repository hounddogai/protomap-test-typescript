import * as text from "../../../../kit/text.js";
import { GlobalDomainThreshold } from "./global-domain-threshold.js";

/** How screens and exports show a global domain threshold. */
export class GlobalDomainThresholdView {
  code: string;
  name: string;
  phone: string;
  journeyId: string;
  variant: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    journeyId: string,
    variant: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.journeyId = journeyId;
    this.variant = variant;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalDomainThresholdView(item: GlobalDomainThreshold): GlobalDomainThresholdView {
  return new GlobalDomainThresholdView(
    item.code,
    text.truncate(item.name, 64),
    item.phone,
    item.journeyId,
    text.truncate(item.variant, 40),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalDomainThresholdViews(items: GlobalDomainThreshold[]): GlobalDomainThresholdView[] {
  const views: GlobalDomainThresholdView[] = [];
  for (const item of items) {
    views.push(toGlobalDomainThresholdView(item));
  }
  return views;
}

export function sumGlobalDomainThresholdView(view: GlobalDomainThresholdView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
