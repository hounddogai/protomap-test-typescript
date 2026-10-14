import * as text from "../../../../kit/text.js";
import { CappedWindowNotice } from "./capped-window-notice.js";

/** How screens and exports show a capped window notice. */
export class CappedWindowNoticeView {
  code: string;
  label: string;
  versionText: string;
  categoryText: string;
  titleText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    versionText: string,
    categoryText: string,
    titleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.versionText = versionText;
    this.categoryText = categoryText;
    this.titleText = titleText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedWindowNoticeView(item: CappedWindowNotice): CappedWindowNoticeView {
  return new CappedWindowNoticeView(
    item.code,
    item.label,
    String(item.version),
    item.category,
    text.truncate(item.title, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedWindowNoticeViews(items: CappedWindowNotice[]): CappedWindowNoticeView[] {
  const views: CappedWindowNoticeView[] = [];
  for (const item of items) {
    views.push(toCappedWindowNoticeView(item));
  }
  return views;
}

export function sumCappedWindowNoticeView(view: CappedWindowNoticeView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedVersion;
}
