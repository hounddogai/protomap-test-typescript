import * as text from "../../../../kit/text.js";
import { PacingTemplate } from "./pacing-template.js";

/** How screens and exports show a pacing template. */
export class PacingTemplateView {
  code: string;
  title: string;
  windowDays: string;
  endsAt: string;
  durationMinutes: string;
  utmSource: string;
  batchSize: string;
  discountText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    endsAt: string,
    durationMinutes: string,
    utmSource: string,
    batchSize: string,
    discountText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.endsAt = endsAt;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.discountText = discountText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPacingTemplateView(item: PacingTemplate): PacingTemplateView {
  return new PacingTemplateView(
    text.truncate(item.code, 64),
    item.title,
    String(item.windowDays),
    String(item.endsAt),
    String(item.durationMinutes),
    item.utmSource,
    String(item.batchSize),
    item.discount.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingTemplateViews(items: PacingTemplate[]): PacingTemplateView[] {
  const views: PacingTemplateView[] = [];
  for (const item of items) {
    views.push(toPacingTemplateView(item));
  }
  return views;
}

export function sumPacingTemplateView(view: PacingTemplateView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedWindowDays + parsedEndsAt + parsedDurationMinutes;
}
