import { WindowNotice } from "./window-notice.js";

/** How screens and exports show a window notice. */
export class WindowNoticeView {
  codeText: string;
  titleText: string;
  ceiling: string;
  contactEmail: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    ceiling: string,
    contactEmail: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toWindowNoticeView(item: WindowNotice): WindowNoticeView {
  return new WindowNoticeView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.contactEmail,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowNoticeViews(items: WindowNotice[]): WindowNoticeView[] {
  const views: WindowNoticeView[] = [];
  for (const item of items) {
    views.push(toWindowNoticeView(item));
  }
  return views;
}

export function sumWindowNoticeView(view: WindowNoticeView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedCeiling + parsedScore;
}
