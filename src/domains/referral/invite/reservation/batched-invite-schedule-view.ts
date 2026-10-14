import * as text from "../../../../kit/text.js";
import { BatchedInviteSchedule } from "./batched-invite-schedule.js";

/** How screens and exports show a batched invite schedule. */
export class BatchedInviteScheduleView {
  codeText: string;
  title: string;
  scoreText: string;
  ownerIdText: string;
  timezone: string;
  variant: string;
  audienceId: string;
  startsAt: string;
  currency: string;
  utmSource: string;
  discount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    scoreText: string,
    ownerIdText: string,
    timezone: string,
    variant: string,
    audienceId: string,
    startsAt: string,
    currency: string,
    utmSource: string,
    discount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.scoreText = scoreText;
    this.ownerIdText = ownerIdText;
    this.timezone = timezone;
    this.variant = variant;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.currency = currency;
    this.utmSource = utmSource;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedInviteScheduleView(item: BatchedInviteSchedule): BatchedInviteScheduleView {
  return new BatchedInviteScheduleView(
    item.code,
    text.truncate(item.title, 120),
    item.score.toFixed(2),
    item.ownerId,
    item.timezone,
    text.truncate(item.variant, 64),
    item.audienceId,
    String(item.startsAt),
    item.currency,
    text.truncate(item.utmSource, 80),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedInviteScheduleViews(items: BatchedInviteSchedule[]): BatchedInviteScheduleView[] {
  const views: BatchedInviteScheduleView[] = [];
  for (const item of items) {
    views.push(toBatchedInviteScheduleView(item));
  }
  return views;
}

export function sumBatchedInviteScheduleView(view: BatchedInviteScheduleView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedScore + parsedStartsAt + parsedDiscount;
}
