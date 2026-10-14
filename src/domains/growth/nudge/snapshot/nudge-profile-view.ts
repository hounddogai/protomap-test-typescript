import * as text from "../../../../kit/text.js";
import { NudgeProfile } from "./nudge-profile.js";

/** How screens and exports show a nudge profile. */
export class NudgeProfileView {
  code: string;
  nameText: string;
  revision: string;
  retriesText: string;
  score: string;
  timezoneText: string;
  openRateText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    revision: string,
    retriesText: string,
    score: string,
    timezoneText: string,
    openRateText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.revision = revision;
    this.retriesText = retriesText;
    this.score = score;
    this.timezoneText = timezoneText;
    this.openRateText = openRateText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeProfileView(item: NudgeProfile): NudgeProfileView {
  return new NudgeProfileView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 40),
    String(item.revision),
    String(item.retries),
    item.score.toFixed(2),
    item.timezone,
    item.openRate.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeProfileViews(items: NudgeProfile[]): NudgeProfileView[] {
  const views: NudgeProfileView[] = [];
  for (const item of items) {
    views.push(toNudgeProfileView(item));
  }
  return views;
}

export function sumNudgeProfileView(view: NudgeProfileView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedRevision + parsedRetries + parsedScore;
}
