import * as text from "../../../../kit/text.js";
import { CappedFrequencyDraft } from "./capped-frequency-draft.js";

/** How screens and exports show a capped frequency draft. */
export class CappedFrequencyDraftView {
  code: string;
  titleText: string;
  contactEmail: string;
  startsAt: string;
  channel: string;
  active: string;
  limit: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    contactEmail: string,
    startsAt: string,
    channel: string,
    active: string,
    limit: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.startsAt = startsAt;
    this.channel = channel;
    this.active = active;
    this.limit = limit;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFrequencyDraftView(item: CappedFrequencyDraft): CappedFrequencyDraftView {
  return new CappedFrequencyDraftView(
    text.truncate(item.code, 80),
    item.title,
    text.truncate(item.contactEmail, 64),
    String(item.startsAt),
    item.channel,
    `${item.active}`,
    String(item.limit),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFrequencyDraftViews(items: CappedFrequencyDraft[]): CappedFrequencyDraftView[] {
  const views: CappedFrequencyDraftView[] = [];
  for (const item of items) {
    views.push(toCappedFrequencyDraftView(item));
  }
  return views;
}

export function sumCappedFrequencyDraftView(view: CappedFrequencyDraftView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedStartsAt + parsedLimit + parsedVersion;
}
