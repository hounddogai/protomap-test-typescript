import { DefaultInsightPlan } from "./default-insight-plan.js";

/** How screens and exports show a default insight plan. */
export class DefaultInsightPlanView {
  code: string;
  nameText: string;
  revision: string;
  clicks: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    revision: string,
    clicks: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.revision = revision;
    this.clicks = clicks;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultInsightPlanView(item: DefaultInsightPlan): DefaultInsightPlanView {
  return new DefaultInsightPlanView(
    item.code,
    item.name,
    String(item.revision),
    String(item.clicks),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultInsightPlanViews(items: DefaultInsightPlan[]): DefaultInsightPlanView[] {
  const views: DefaultInsightPlanView[] = [];
  for (const item of items) {
    views.push(toDefaultInsightPlanView(item));
  }
  return views;
}

export function sumDefaultInsightPlanView(view: DefaultInsightPlanView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedRevision + parsedClicks + parsedLimit;
}
