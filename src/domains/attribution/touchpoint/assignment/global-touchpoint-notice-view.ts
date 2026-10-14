import * as text from "../../../../kit/text.js";
import { GlobalTouchpointNotice } from "./global-touchpoint-notice.js";

/** How screens and exports show a global touchpoint notice. */
export class GlobalTouchpointNoticeView {
  code: string;
  titleText: string;
  threshold: string;
  category: string;
  updatedAt: string;
  channel: string;
  archivedText: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    threshold: string,
    category: string,
    updatedAt: string,
    channel: string,
    archivedText: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.threshold = threshold;
    this.category = category;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.archivedText = archivedText;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalTouchpointNoticeView(item: GlobalTouchpointNotice): GlobalTouchpointNoticeView {
  return new GlobalTouchpointNoticeView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    item.category,
    String(item.updatedAt),
    text.truncate(item.channel, 80),
    `${item.archived}`,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalTouchpointNoticeViews(items: GlobalTouchpointNotice[]): GlobalTouchpointNoticeView[] {
  const views: GlobalTouchpointNoticeView[] = [];
  for (const item of items) {
    views.push(toGlobalTouchpointNoticeView(item));
  }
  return views;
}

export function sumGlobalTouchpointNoticeView(view: GlobalTouchpointNoticeView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedThreshold + parsedUpdatedAt + parsedImpressions;
}
