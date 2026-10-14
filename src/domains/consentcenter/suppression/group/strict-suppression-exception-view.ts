import { StrictSuppressionException } from "./strict-suppression-exception.js";

/** How screens and exports show a strict suppression exception. */
export class StrictSuppressionExceptionView {
  code: string;
  name: string;
  priority: string;
  durationMinutes: string;
  marginText: string;
  notesText: string;
  sequenceText: string;
  localeText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priority: string,
    durationMinutes: string,
    marginText: string,
    notesText: string,
    sequenceText: string,
    localeText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.marginText = marginText;
    this.notesText = notesText;
    this.sequenceText = sequenceText;
    this.localeText = localeText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toStrictSuppressionExceptionView(item: StrictSuppressionException): StrictSuppressionExceptionView {
  return new StrictSuppressionExceptionView(
    item.code,
    item.name,
    String(item.priority),
    String(item.durationMinutes),
    item.margin.toFixed(2),
    item.notes,
    String(item.sequence),
    item.locale,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictSuppressionExceptionViews(items: StrictSuppressionException[]): StrictSuppressionExceptionView[] {
  const views: StrictSuppressionExceptionView[] = [];
  for (const item of items) {
    views.push(toStrictSuppressionExceptionView(item));
  }
  return views;
}

export function sumStrictSuppressionExceptionView(view: StrictSuppressionExceptionView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedPriority + parsedDurationMinutes + parsedMargin;
}
