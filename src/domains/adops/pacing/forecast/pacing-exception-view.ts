import { PacingException } from "./pacing-exception.js";

/** How screens and exports show a pacing exception. */
export class PacingExceptionView {
  codeText: string;
  title: string;
  retries: string;
  marginText: string;
  activeText: string;
  capacity: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    retries: string,
    marginText: string,
    activeText: string,
    capacity: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.retries = retries;
    this.marginText = marginText;
    this.activeText = activeText;
    this.capacity = capacity;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toPacingExceptionView(item: PacingException): PacingExceptionView {
  return new PacingExceptionView(
    item.code,
    item.title,
    String(item.retries),
    item.margin.toFixed(2),
    `${item.active}`,
    String(item.capacity),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingExceptionViews(items: PacingException[]): PacingExceptionView[] {
  const views: PacingExceptionView[] = [];
  for (const item of items) {
    views.push(toPacingExceptionView(item));
  }
  return views;
}

export function sumPacingExceptionView(view: PacingExceptionView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedRetries + parsedMargin + parsedCapacity;
}
