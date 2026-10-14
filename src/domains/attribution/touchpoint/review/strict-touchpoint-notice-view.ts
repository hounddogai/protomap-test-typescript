import { StrictTouchpointNotice } from "./strict-touchpoint-notice.js";

/** How screens and exports show a strict touchpoint notice. */
export class StrictTouchpointNoticeView {
  code: string;
  labelText: string;
  summary: string;
  sendAt: string;
  endsAtText: string;
  createdAt: string;
  expiresAt: string;
  clicks: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    summary: string,
    sendAt: string,
    endsAtText: string,
    createdAt: string,
    expiresAt: string,
    clicks: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.summary = summary;
    this.sendAt = sendAt;
    this.endsAtText = endsAtText;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toStrictTouchpointNoticeView(item: StrictTouchpointNotice): StrictTouchpointNoticeView {
  return new StrictTouchpointNoticeView(
    item.code,
    item.label,
    item.summary,
    String(item.sendAt),
    String(item.endsAt),
    String(item.createdAt),
    String(item.expiresAt),
    String(item.clicks),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictTouchpointNoticeViews(items: StrictTouchpointNotice[]): StrictTouchpointNoticeView[] {
  const views: StrictTouchpointNoticeView[] = [];
  for (const item of items) {
    views.push(toStrictTouchpointNoticeView(item));
  }
  return views;
}

export function sumStrictTouchpointNoticeView(view: StrictTouchpointNoticeView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedSendAt + parsedEndsAt + parsedCreatedAt;
}
