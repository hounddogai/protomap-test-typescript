import { AdaptiveLeaderboardMetric } from "./adaptive-leaderboard-metric.js";

/** How screens and exports show a adaptive leaderboard metric. */
export class AdaptiveLeaderboardMetricView {
  code: string;
  nameText: string;
  cohortText: string;
  priority: string;
  statusLabel: string;

  constructor(code: string, nameText: string, cohortText: string, priority: string, statusLabel: string) {
    this.code = code;
    this.nameText = nameText;
    this.cohortText = cohortText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveLeaderboardMetricView(item: AdaptiveLeaderboardMetric): AdaptiveLeaderboardMetricView {
  return new AdaptiveLeaderboardMetricView(
    item.code,
    item.name,
    item.cohort,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveLeaderboardMetricViews(items: AdaptiveLeaderboardMetric[]): AdaptiveLeaderboardMetricView[] {
  const views: AdaptiveLeaderboardMetricView[] = [];
  for (const item of items) {
    views.push(toAdaptiveLeaderboardMetricView(item));
  }
  return views;
}

export function sumAdaptiveLeaderboardMetricView(view: AdaptiveLeaderboardMetricView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
