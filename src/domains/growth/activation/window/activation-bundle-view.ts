import { ActivationBundle } from "./activation-bundle.js";

/** How screens and exports show a activation bundle. */
export class ActivationBundleView {
  codeText: string;
  label: string;
  threshold: string;
  locale: string;
  sequence: string;
  durationMinutes: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    threshold: string,
    locale: string,
    sequence: string,
    durationMinutes: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.threshold = threshold;
    this.locale = locale;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toActivationBundleView(item: ActivationBundle): ActivationBundleView {
  return new ActivationBundleView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    item.locale,
    String(item.sequence),
    String(item.durationMinutes),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationBundleViews(items: ActivationBundle[]): ActivationBundleView[] {
  const views: ActivationBundleView[] = [];
  for (const item of items) {
    views.push(toActivationBundleView(item));
  }
  return views;
}

export function sumActivationBundleView(view: ActivationBundleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedThreshold + parsedSequence + parsedDurationMinutes;
}
