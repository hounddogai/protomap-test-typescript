import * as text from "../../../../kit/text.js";
import { WindowException } from "./window-exception.js";

/** How screens and exports show a window exception. */
export class WindowExceptionView {
  code: string;
  nameText: string;
  locale: string;
  minimumText: string;
  startsAt: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    locale: string,
    minimumText: string,
    startsAt: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.locale = locale;
    this.minimumText = minimumText;
    this.startsAt = startsAt;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowExceptionView(item: WindowException): WindowExceptionView {
  return new WindowExceptionView(
    text.truncate(item.code, 64),
    item.name,
    item.locale,
    item.minimum.toFixed(2),
    String(item.startsAt),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowExceptionViews(items: WindowException[]): WindowExceptionView[] {
  const views: WindowExceptionView[] = [];
  for (const item of items) {
    views.push(toWindowExceptionView(item));
  }
  return views;
}

export function sumWindowExceptionView(view: WindowExceptionView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedMinimum + parsedStartsAt;
}
