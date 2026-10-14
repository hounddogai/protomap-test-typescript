import { RewardRuleCycle } from "./reward-rule-cycle.js";

/** How screens and exports show a reward rule cycle. */
export class RewardRuleCycleView {
  code: string;
  label: string;
  priority: string;
  maximum: string;
  segmentText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    maximum: string,
    segmentText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.maximum = maximum;
    this.segmentText = segmentText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleCycleView(item: RewardRuleCycle): RewardRuleCycleView {
  return new RewardRuleCycleView(
    item.code,
    item.label,
    String(item.priority),
    item.maximum.toFixed(2),
    item.segment,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleCycleViews(items: RewardRuleCycle[]): RewardRuleCycleView[] {
  const views: RewardRuleCycleView[] = [];
  for (const item of items) {
    views.push(toRewardRuleCycleView(item));
  }
  return views;
}

export function sumRewardRuleCycleView(view: RewardRuleCycleView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedPriority + parsedMaximum;
}
