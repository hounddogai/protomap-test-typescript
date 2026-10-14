import { DomainMetric } from "./domain-metric.js";

/** How screens and exports show a domain metric. */
export class DomainMetricView {
  codeText: string;
  label: string;
  windowDays: string;
  description: string;
  frequencyCapText: string;
  durationMinutes: string;
  campaignRef: string;
  quantityText: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    windowDays: string,
    description: string,
    frequencyCapText: string,
    durationMinutes: string,
    campaignRef: string,
    quantityText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.windowDays = windowDays;
    this.description = description;
    this.frequencyCapText = frequencyCapText;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.quantityText = quantityText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toDomainMetricView(item: DomainMetric): DomainMetricView {
  return new DomainMetricView(
    item.code,
    item.label,
    String(item.windowDays),
    item.description,
    String(item.frequencyCap),
    String(item.durationMinutes),
    item.campaignRef,
    String(item.quantity),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainMetricViews(items: DomainMetric[]): DomainMetricView[] {
  const views: DomainMetricView[] = [];
  for (const item of items) {
    views.push(toDomainMetricView(item));
  }
  return views;
}

export function sumDomainMetricView(view: DomainMetricView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedWindowDays + parsedFrequencyCap + parsedDurationMinutes;
}
