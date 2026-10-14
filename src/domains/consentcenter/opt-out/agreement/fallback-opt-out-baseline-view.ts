import { FallbackOptOutBaseline } from "./fallback-opt-out-baseline.js";

/** How screens and exports show a fallback opt out baseline. */
export class FallbackOptOutBaselineView {
  code: string;
  label: string;
  durationMinutesText: string;
  attempts: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutesText: string,
    attempts: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutesText = durationMinutesText;
    this.attempts = attempts;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackOptOutBaselineView(item: FallbackOptOutBaseline): FallbackOptOutBaselineView {
  return new FallbackOptOutBaselineView(
    item.code,
    item.label,
    String(item.durationMinutes),
    String(item.attempts),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackOptOutBaselineViews(items: FallbackOptOutBaseline[]): FallbackOptOutBaselineView[] {
  const views: FallbackOptOutBaselineView[] = [];
  for (const item of items) {
    views.push(toFallbackOptOutBaselineView(item));
  }
  return views;
}

export function sumFallbackOptOutBaselineView(view: FallbackOptOutBaselineView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedDurationMinutes + parsedAttempts;
}
