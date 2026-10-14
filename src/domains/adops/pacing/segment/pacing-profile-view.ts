import { PacingProfile } from "./pacing-profile.js";

/** How screens and exports show a pacing profile. */
export class PacingProfileView {
  code: string;
  titleText: string;
  sendAtText: string;
  startsAt: string;
  reviewer: string;
  externalRef: string;
  locale: string;
  score: string;
  cost: string;
  phone: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sendAtText: string,
    startsAt: string,
    reviewer: string,
    externalRef: string,
    locale: string,
    score: string,
    cost: string,
    phone: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sendAtText = sendAtText;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.locale = locale;
    this.score = score;
    this.cost = cost;
    this.phone = phone;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toPacingProfileView(item: PacingProfile): PacingProfileView {
  return new PacingProfileView(
    item.code,
    item.title,
    String(item.sendAt),
    String(item.startsAt),
    item.reviewer,
    item.externalRef,
    item.locale,
    item.score.toFixed(2),
    item.cost.toFixed(2),
    item.phone,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingProfileViews(items: PacingProfile[]): PacingProfileView[] {
  const views: PacingProfileView[] = [];
  for (const item of items) {
    views.push(toPacingProfileView(item));
  }
  return views;
}

export function sumPacingProfileView(view: PacingProfileView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedSendAt + parsedStartsAt + parsedScore;
}
