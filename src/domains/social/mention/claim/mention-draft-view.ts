import * as text from "../../../../kit/text.js";
import { MentionDraft } from "./mention-draft.js";

/** How screens and exports show a mention draft. */
export class MentionDraftView {
  codeText: string;
  name: string;
  graceDays: string;
  score: string;
  segment: string;
  capacity: string;
  ownerId: string;
  currencyText: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    graceDays: string,
    score: string,
    segment: string,
    capacity: string,
    ownerId: string,
    currencyText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.graceDays = graceDays;
    this.score = score;
    this.segment = segment;
    this.capacity = capacity;
    this.ownerId = ownerId;
    this.currencyText = currencyText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toMentionDraftView(item: MentionDraft): MentionDraftView {
  return new MentionDraftView(
    item.code,
    text.truncate(item.name, 80),
    String(item.graceDays),
    item.score.toFixed(2),
    item.segment,
    String(item.capacity),
    item.ownerId,
    item.currency,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionDraftViews(items: MentionDraft[]): MentionDraftView[] {
  const views: MentionDraftView[] = [];
  for (const item of items) {
    views.push(toMentionDraftView(item));
  }
  return views;
}

export function sumMentionDraftView(view: MentionDraftView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedGraceDays + parsedScore + parsedCapacity;
}
