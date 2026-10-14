import * as text from "../../../../kit/text.js";
import { MentionVariance } from "./mention-variance.js";

/** How screens and exports show a mention variance. */
export class MentionVarianceView {
  code: string;
  label: string;
  rate: string;
  variant: string;
  channel: string;
  locale: string;
  externalRef: string;
  audienceId: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rate: string,
    variant: string,
    channel: string,
    locale: string,
    externalRef: string,
    audienceId: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.variant = variant;
    this.channel = channel;
    this.locale = locale;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionVarianceView(item: MentionVariance): MentionVarianceView {
  return new MentionVarianceView(
    item.code,
    text.truncate(item.label, 40),
    item.rate.toFixed(2),
    item.variant,
    item.channel,
    text.truncate(item.locale, 40),
    item.externalRef,
    item.audienceId,
    text.truncate(item.category, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionVarianceViews(items: MentionVariance[]): MentionVarianceView[] {
  const views: MentionVarianceView[] = [];
  for (const item of items) {
    views.push(toMentionVarianceView(item));
  }
  return views;
}

export function sumMentionVarianceView(view: MentionVarianceView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
