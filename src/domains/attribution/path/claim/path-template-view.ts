import * as text from "../../../../kit/text.js";
import { PathTemplate } from "./path-template.js";

/** How screens and exports show a path template. */
export class PathTemplateView {
  code: string;
  name: string;
  phone: string;
  label: string;
  pinnedText: string;
  visibleText: string;
  windowDays: string;
  startsAt: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    label: string,
    pinnedText: string,
    visibleText: string,
    windowDays: string,
    startsAt: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.label = label;
    this.pinnedText = pinnedText;
    this.visibleText = visibleText;
    this.windowDays = windowDays;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toPathTemplateView(item: PathTemplate): PathTemplateView {
  return new PathTemplateView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.phone, 80),
    item.label,
    `${item.pinned}`,
    `${item.visible}`,
    String(item.windowDays),
    String(item.startsAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathTemplateViews(items: PathTemplate[]): PathTemplateView[] {
  const views: PathTemplateView[] = [];
  for (const item of items) {
    views.push(toPathTemplateView(item));
  }
  return views;
}

export function sumPathTemplateView(view: PathTemplateView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedWindowDays + parsedStartsAt + parsedClicks;
}
