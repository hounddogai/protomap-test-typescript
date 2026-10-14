import { WindowProfile } from "./window-profile.js";

/** How screens and exports show a window profile. */
export class WindowProfileView {
  code: string;
  name: string;
  priority: string;
  sendAtText: string;
  retriesText: string;
  ceiling: string;
  utmSource: string;
  pinned: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priority: string,
    sendAtText: string,
    retriesText: string,
    ceiling: string,
    utmSource: string,
    pinned: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.sendAtText = sendAtText;
    this.retriesText = retriesText;
    this.ceiling = ceiling;
    this.utmSource = utmSource;
    this.pinned = pinned;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowProfileView(item: WindowProfile): WindowProfileView {
  return new WindowProfileView(
    item.code,
    item.name,
    String(item.priority),
    String(item.sendAt),
    String(item.retries),
    item.ceiling.toFixed(2),
    item.utmSource,
    `${item.pinned}`,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowProfileViews(items: WindowProfile[]): WindowProfileView[] {
  const views: WindowProfileView[] = [];
  for (const item of items) {
    views.push(toWindowProfileView(item));
  }
  return views;
}

export function sumWindowProfileView(view: WindowProfileView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedPriority + parsedSendAt + parsedRetries;
}
