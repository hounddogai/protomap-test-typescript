import { CappedInsightMetric } from "./capped-insight-metric.js";

/** How screens and exports show a capped insight metric. */
export class CappedInsightMetricView {
  codeText: string;
  label: string;
  archivedText: string;
  activeText: string;
  segment: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    archivedText: string,
    activeText: string,
    segment: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.archivedText = archivedText;
    this.activeText = activeText;
    this.segment = segment;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedInsightMetricView(item: CappedInsightMetric): CappedInsightMetricView {
  return new CappedInsightMetricView(
    item.code,
    item.label,
    `${item.archived}`,
    `${item.active}`,
    item.segment,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedInsightMetricViews(items: CappedInsightMetric[]): CappedInsightMetricView[] {
  const views: CappedInsightMetricView[] = [];
  for (const item of items) {
    views.push(toCappedInsightMetricView(item));
  }
  return views;
}

export function sumCappedInsightMetricView(view: CappedInsightMetricView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedAttempts;
}
