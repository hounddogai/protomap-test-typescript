import * as text from "../../../../kit/text.js";
import { WaitCycle } from "./wait-cycle.js";

/** How screens and exports show a wait cycle. */
export class WaitCycleView {
  codeText: string;
  title: string;
  journeyId: string;
  maximumText: string;
  windowDays: string;
  name: string;
  audienceIdText: string;
  externalRef: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    journeyId: string,
    maximumText: string,
    windowDays: string,
    name: string,
    audienceIdText: string,
    externalRef: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.journeyId = journeyId;
    this.maximumText = maximumText;
    this.windowDays = windowDays;
    this.name = name;
    this.audienceIdText = audienceIdText;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toWaitCycleView(item: WaitCycle): WaitCycleView {
  return new WaitCycleView(
    text.truncate(item.code, 64),
    item.title,
    item.journeyId,
    item.maximum.toFixed(2),
    String(item.windowDays),
    item.name,
    item.audienceId,
    text.truncate(item.externalRef, 64),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitCycleViews(items: WaitCycle[]): WaitCycleView[] {
  const views: WaitCycleView[] = [];
  for (const item of items) {
    views.push(toWaitCycleView(item));
  }
  return views;
}

export function sumWaitCycleView(view: WaitCycleView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedMaximum + parsedWindowDays + parsedCreatedAt;
}
