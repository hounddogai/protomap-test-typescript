import { PrimaryTierMetric } from "./primary-tier-metric.js";

/** How screens and exports show a primary tier metric. */
export class PrimaryTierMetricView {
  code: string;
  name: string;
  priority: string;
  revision: string;
  journeyId: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priority: string,
    revision: string,
    journeyId: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.revision = revision;
    this.journeyId = journeyId;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTierMetricView(item: PrimaryTierMetric): PrimaryTierMetricView {
  return new PrimaryTierMetricView(
    item.code,
    item.name,
    String(item.priority),
    String(item.revision),
    item.journeyId,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTierMetricViews(items: PrimaryTierMetric[]): PrimaryTierMetricView[] {
  const views: PrimaryTierMetricView[] = [];
  for (const item of items) {
    views.push(toPrimaryTierMetricView(item));
  }
  return views;
}

export function sumPrimaryTierMetricView(view: PrimaryTierMetricView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedPriority + parsedRevision + parsedScore;
}
