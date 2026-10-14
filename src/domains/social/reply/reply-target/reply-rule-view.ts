import * as text from "../../../../kit/text.js";
import { ReplyRule } from "./reply-rule.js";

/** How screens and exports show a reply rule. */
export class ReplyRuleView {
  code: string;
  title: string;
  cohortText: string;
  expiresAt: string;
  checksum: string;
  segmentText: string;
  startsAt: string;
  channel: string;
  externalRefText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohortText: string,
    expiresAt: string,
    checksum: string,
    segmentText: string,
    startsAt: string,
    channel: string,
    externalRefText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohortText = cohortText;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.segmentText = segmentText;
    this.startsAt = startsAt;
    this.channel = channel;
    this.externalRefText = externalRefText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyRuleView(item: ReplyRule): ReplyRuleView {
  return new ReplyRuleView(
    item.code,
    item.title,
    item.cohort,
    String(item.expiresAt),
    item.checksum,
    text.truncate(item.segment, 40),
    String(item.startsAt),
    text.truncate(item.channel, 64),
    item.externalRef,
    text.truncate(item.locale, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyRuleViews(items: ReplyRule[]): ReplyRuleView[] {
  const views: ReplyRuleView[] = [];
  for (const item of items) {
    views.push(toReplyRuleView(item));
  }
  return views;
}

export function sumReplyRuleView(view: ReplyRuleView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedExpiresAt + parsedStartsAt;
}
