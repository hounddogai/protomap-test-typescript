import { ActivationCycle } from "./activation-cycle.js";

/** How screens and exports show a activation cycle. */
export class ActivationCycleView {
  code: string;
  label: string;
  retries: string;
  margin: string;
  versionText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    margin: string,
    versionText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.margin = margin;
    this.versionText = versionText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toActivationCycleView(item: ActivationCycle): ActivationCycleView {
  return new ActivationCycleView(
    item.code,
    item.label,
    String(item.retries),
    item.margin.toFixed(2),
    String(item.version),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationCycleViews(items: ActivationCycle[]): ActivationCycleView[] {
  const views: ActivationCycleView[] = [];
  for (const item of items) {
    views.push(toActivationCycleView(item));
  }
  return views;
}

export function sumActivationCycleView(view: ActivationCycleView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedRetries + parsedMargin + parsedVersion;
}
