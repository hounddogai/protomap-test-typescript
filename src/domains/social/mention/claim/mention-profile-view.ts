import * as text from "../../../../kit/text.js";
import { MentionProfile } from "./mention-profile.js";

/** How screens and exports show a mention profile. */
export class MentionProfileView {
  code: string;
  name: string;
  currency: string;
  maximum: string;
  description: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currency: string,
    maximum: string,
    description: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.maximum = maximum;
    this.description = description;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionProfileView(item: MentionProfile): MentionProfileView {
  return new MentionProfileView(
    item.code,
    item.name,
    item.currency,
    item.maximum.toFixed(2),
    text.truncate(item.description, 40),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionProfileViews(items: MentionProfile[]): MentionProfileView[] {
  const views: MentionProfileView[] = [];
  for (const item of items) {
    views.push(toMentionProfileView(item));
  }
  return views;
}

export function sumMentionProfileView(view: MentionProfileView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedMaximum + parsedMinimum;
}
