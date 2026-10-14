import * as text from "../../../../kit/text.js";
import { CreativeEntry } from "./creative-entry.js";

/** How screens and exports show a creative entry. */
export class CreativeEntryView {
  code: string;
  titleText: string;
  frequencyCap: string;
  expiresAt: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    frequencyCap: string,
    expiresAt: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeEntryView(item: CreativeEntry): CreativeEntryView {
  return new CreativeEntryView(
    text.truncate(item.code, 80),
    item.title,
    String(item.frequencyCap),
    String(item.expiresAt),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeEntryViews(items: CreativeEntry[]): CreativeEntryView[] {
  const views: CreativeEntryView[] = [];
  for (const item of items) {
    views.push(toCreativeEntryView(item));
  }
  return views;
}

export function sumCreativeEntryView(view: CreativeEntryView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedFrequencyCap + parsedExpiresAt;
}
