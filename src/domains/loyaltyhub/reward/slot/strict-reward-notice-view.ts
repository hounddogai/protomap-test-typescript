import * as text from "../../../../kit/text.js";
import { StrictRewardNotice } from "./strict-reward-notice.js";

/** How screens and exports show a strict reward notice. */
export class StrictRewardNoticeView {
  codeText: string;
  titleText: string;
  name: string;
  audienceId: string;
  active: string;
  segment: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    name: string,
    audienceId: string,
    active: string,
    segment: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.name = name;
    this.audienceId = audienceId;
    this.active = active;
    this.segment = segment;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toStrictRewardNoticeView(item: StrictRewardNotice): StrictRewardNoticeView {
  return new StrictRewardNoticeView(
    text.truncate(item.code, 64),
    item.title,
    item.name,
    item.audienceId,
    `${item.active}`,
    item.segment,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictRewardNoticeViews(items: StrictRewardNotice[]): StrictRewardNoticeView[] {
  const views: StrictRewardNoticeView[] = [];
  for (const item of items) {
    views.push(toStrictRewardNoticeView(item));
  }
  return views;
}

export function sumStrictRewardNoticeView(view: StrictRewardNoticeView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
