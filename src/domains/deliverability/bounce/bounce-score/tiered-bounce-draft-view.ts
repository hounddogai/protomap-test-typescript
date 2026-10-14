import * as text from "../../../../kit/text.js";
import { TieredBounceDraft } from "./tiered-bounce-draft.js";

/** How screens and exports show a tiered bounce draft. */
export class TieredBounceDraftView {
  codeText: string;
  nameText: string;
  contactEmail: string;
  channel: string;
  source: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    contactEmail: string,
    channel: string,
    source: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.source = source;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBounceDraftView(item: TieredBounceDraft): TieredBounceDraftView {
  return new TieredBounceDraftView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    item.contactEmail,
    item.channel,
    item.source,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBounceDraftViews(items: TieredBounceDraft[]): TieredBounceDraftView[] {
  const views: TieredBounceDraftView[] = [];
  for (const item of items) {
    views.push(toTieredBounceDraftView(item));
  }
  return views;
}

export function sumTieredBounceDraftView(view: TieredBounceDraftView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
