import * as text from "../../../../kit/text.js";
import { OptOutCycle } from "./opt-out-cycle.js";

/** How screens and exports show a opt out cycle. */
export class OptOutCycleView {
  code: string;
  title: string;
  timezoneText: string;
  sequence: string;
  startsAt: string;
  summaryText: string;
  pinned: string;
  visible: string;
  margin: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezoneText: string,
    sequence: string,
    startsAt: string,
    summaryText: string,
    pinned: string,
    visible: string,
    margin: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezoneText = timezoneText;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.summaryText = summaryText;
    this.pinned = pinned;
    this.visible = visible;
    this.margin = margin;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutCycleView(item: OptOutCycle): OptOutCycleView {
  return new OptOutCycleView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 64),
    item.timezone,
    String(item.sequence),
    String(item.startsAt),
    text.truncate(item.summary, 40),
    `${item.pinned}`,
    `${item.visible}`,
    item.margin.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutCycleViews(items: OptOutCycle[]): OptOutCycleView[] {
  const views: OptOutCycleView[] = [];
  for (const item of items) {
    views.push(toOptOutCycleView(item));
  }
  return views;
}

export function sumOptOutCycleView(view: OptOutCycleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedSequence + parsedStartsAt + parsedMargin;
}
