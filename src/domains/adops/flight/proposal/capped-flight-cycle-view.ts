import { CappedFlightCycle } from "./capped-flight-cycle.js";

/** How screens and exports show a capped flight cycle. */
export class CappedFlightCycleView {
  code: string;
  labelText: string;
  active: string;
  margin: string;
  category: string;
  variant: string;
  durationMinutesText: string;
  attemptsText: string;
  segment: string;
  frequencyCap: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    active: string,
    margin: string,
    category: string,
    variant: string,
    durationMinutesText: string,
    attemptsText: string,
    segment: string,
    frequencyCap: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.active = active;
    this.margin = margin;
    this.category = category;
    this.variant = variant;
    this.durationMinutesText = durationMinutesText;
    this.attemptsText = attemptsText;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFlightCycleView(item: CappedFlightCycle): CappedFlightCycleView {
  return new CappedFlightCycleView(
    item.code,
    item.label,
    `${item.active}`,
    item.margin.toFixed(2),
    item.category,
    item.variant,
    String(item.durationMinutes),
    String(item.attempts),
    item.segment,
    String(item.frequencyCap),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFlightCycleViews(items: CappedFlightCycle[]): CappedFlightCycleView[] {
  const views: CappedFlightCycleView[] = [];
  for (const item of items) {
    views.push(toCappedFlightCycleView(item));
  }
  return views;
}

export function sumCappedFlightCycleView(view: CappedFlightCycleView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedMargin + parsedDurationMinutes + parsedAttempts;
}
