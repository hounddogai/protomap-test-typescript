import * as text from "../../../../kit/text.js";
import { WeightedRewardTemplate } from "./weighted-reward-template.js";

/** How screens and exports show a weighted reward template. */
export class WeightedRewardTemplateView {
  code: string;
  labelText: string;
  endsAt: string;
  contactEmail: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    endsAt: string,
    contactEmail: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardTemplateView(item: WeightedRewardTemplate): WeightedRewardTemplateView {
  return new WeightedRewardTemplateView(
    item.code,
    text.truncate(item.label, 80),
    String(item.endsAt),
    text.truncate(item.contactEmail, 80),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardTemplateViews(items: WeightedRewardTemplate[]): WeightedRewardTemplateView[] {
  const views: WeightedRewardTemplateView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardTemplateView(item));
  }
  return views;
}

export function sumWeightedRewardTemplateView(view: WeightedRewardTemplateView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedEndsAt;
}
