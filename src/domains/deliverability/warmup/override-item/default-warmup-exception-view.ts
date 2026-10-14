import * as text from "../../../../kit/text.js";
import { DefaultWarmupException } from "./default-warmup-exception.js";

/** How screens and exports show a default warmup exception. */
export class DefaultWarmupExceptionView {
  code: string;
  nameText: string;
  createdAtText: string;
  durationMinutes: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    createdAtText: string,
    durationMinutes: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.createdAtText = createdAtText;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultWarmupExceptionView(item: DefaultWarmupException): DefaultWarmupExceptionView {
  return new DefaultWarmupExceptionView(
    item.code,
    text.truncate(item.name, 64),
    String(item.createdAt),
    String(item.durationMinutes),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultWarmupExceptionViews(items: DefaultWarmupException[]): DefaultWarmupExceptionView[] {
  const views: DefaultWarmupExceptionView[] = [];
  for (const item of items) {
    views.push(toDefaultWarmupExceptionView(item));
  }
  return views;
}

export function sumDefaultWarmupExceptionView(view: DefaultWarmupExceptionView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedCreatedAt + parsedDurationMinutes;
}
