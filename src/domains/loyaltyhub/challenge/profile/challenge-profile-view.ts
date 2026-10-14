import * as text from "../../../../kit/text.js";
import { ChallengeProfile } from "./challenge-profile.js";

/** How screens and exports show a challenge profile. */
export class ChallengeProfileView {
  code: string;
  title: string;
  contactEmail: string;
  timezone: string;
  channel: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    timezone: string,
    channel: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.timezone = timezone;
    this.channel = channel;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeProfileView(item: ChallengeProfile): ChallengeProfileView {
  return new ChallengeProfileView(
    text.truncate(item.code, 120),
    item.title,
    item.contactEmail,
    item.timezone,
    item.channel,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeProfileViews(items: ChallengeProfile[]): ChallengeProfileView[] {
  const views: ChallengeProfileView[] = [];
  for (const item of items) {
    views.push(toChallengeProfileView(item));
  }
  return views;
}

export function sumChallengeProfileView(view: ChallengeProfileView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedBatchSize;
}
