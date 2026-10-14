import * as text from "../../../../kit/text.js";
import { NudgeNotice } from "./nudge-notice.js";

/** How screens and exports show a nudge notice. */
export class NudgeNoticeView {
  code: string;
  title: string;
  priorityText: string;
  minimumText: string;
  threshold: string;
  startsAt: string;
  margin: string;
  nameText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priorityText: string,
    minimumText: string,
    threshold: string,
    startsAt: string,
    margin: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priorityText = priorityText;
    this.minimumText = minimumText;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.margin = margin;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeNoticeView(item: NudgeNotice): NudgeNoticeView {
  return new NudgeNoticeView(
    item.code,
    text.truncate(item.title, 80),
    String(item.priority),
    item.minimum.toFixed(2),
    item.threshold.toFixed(2),
    String(item.startsAt),
    item.margin.toFixed(2),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeNoticeViews(items: NudgeNotice[]): NudgeNoticeView[] {
  const views: NudgeNoticeView[] = [];
  for (const item of items) {
    views.push(toNudgeNoticeView(item));
  }
  return views;
}

export function sumNudgeNoticeView(view: NudgeNoticeView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedPriority + parsedMinimum + parsedThreshold;
}
