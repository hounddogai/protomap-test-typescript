import * as text from "../../../../kit/text.js";
import { TouchpointBudget } from "./touchpoint-budget.js";

/** How screens and exports show a touchpoint budget. */
export class TouchpointBudgetView {
  code: string;
  label: string;
  updatedAt: string;
  sequenceText: string;
  channel: string;
  durationMinutesText: string;
  startsAt: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    sequenceText: string,
    channel: string,
    durationMinutesText: string,
    startsAt: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.sequenceText = sequenceText;
    this.channel = channel;
    this.durationMinutesText = durationMinutesText;
    this.startsAt = startsAt;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointBudgetView(item: TouchpointBudget): TouchpointBudgetView {
  return new TouchpointBudgetView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    String(item.updatedAt),
    String(item.sequence),
    item.channel,
    String(item.durationMinutes),
    String(item.startsAt),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointBudgetViews(items: TouchpointBudget[]): TouchpointBudgetView[] {
  const views: TouchpointBudgetView[] = [];
  for (const item of items) {
    views.push(toTouchpointBudgetView(item));
  }
  return views;
}

export function sumTouchpointBudgetView(view: TouchpointBudgetView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedUpdatedAt + parsedSequence + parsedDurationMinutes;
}
