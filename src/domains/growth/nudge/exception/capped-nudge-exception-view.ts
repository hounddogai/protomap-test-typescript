import { CappedNudgeException } from "./capped-nudge-exception.js";

/** How screens and exports show a capped nudge exception. */
export class CappedNudgeExceptionView {
  codeText: string;
  label: string;
  priority: string;
  openRate: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    openRate: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.openRate = openRate;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toCappedNudgeExceptionView(item: CappedNudgeException): CappedNudgeExceptionView {
  return new CappedNudgeExceptionView(
    item.code,
    item.label,
    String(item.priority),
    item.openRate.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedNudgeExceptionViews(items: CappedNudgeException[]): CappedNudgeExceptionView[] {
  const views: CappedNudgeExceptionView[] = [];
  for (const item of items) {
    views.push(toCappedNudgeExceptionView(item));
  }
  return views;
}

export function sumCappedNudgeExceptionView(view: CappedNudgeExceptionView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedPriority + parsedOpenRate + parsedClicks;
}
