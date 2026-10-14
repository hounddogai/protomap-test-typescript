import { ScheduledSuppressionException } from "./scheduled-suppression-exception.js";

/** How screens and exports show a scheduled suppression exception. */
export class ScheduledSuppressionExceptionView {
  code: string;
  name: string;
  margin: string;
  currencyText: string;
  journeyIdText: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    currencyText: string,
    journeyIdText: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.currencyText = currencyText;
    this.journeyIdText = journeyIdText;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSuppressionExceptionView(item: ScheduledSuppressionException): ScheduledSuppressionExceptionView {
  return new ScheduledSuppressionExceptionView(
    item.code,
    item.name,
    item.margin.toFixed(2),
    item.currency,
    item.journeyId,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSuppressionExceptionViews(items: ScheduledSuppressionException[]): ScheduledSuppressionExceptionView[] {
  const views: ScheduledSuppressionExceptionView[] = [];
  for (const item of items) {
    views.push(toScheduledSuppressionExceptionView(item));
  }
  return views;
}

export function sumScheduledSuppressionExceptionView(view: ScheduledSuppressionExceptionView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMargin;
}
