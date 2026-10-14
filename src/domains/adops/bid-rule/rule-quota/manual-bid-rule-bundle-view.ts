import { ManualBidRuleBundle } from "./manual-bid-rule-bundle.js";

/** How screens and exports show a manual bid rule bundle. */
export class ManualBidRuleBundleView {
  codeText: string;
  title: string;
  priorityText: string;
  cohort: string;
  startsAt: string;
  nameText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    priorityText: string,
    cohort: string,
    startsAt: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.priorityText = priorityText;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toManualBidRuleBundleView(item: ManualBidRuleBundle): ManualBidRuleBundleView {
  return new ManualBidRuleBundleView(
    item.code,
    item.title,
    String(item.priority),
    item.cohort,
    String(item.startsAt),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBidRuleBundleViews(items: ManualBidRuleBundle[]): ManualBidRuleBundleView[] {
  const views: ManualBidRuleBundleView[] = [];
  for (const item of items) {
    views.push(toManualBidRuleBundleView(item));
  }
  return views;
}

export function sumManualBidRuleBundleView(view: ManualBidRuleBundleView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedPriority + parsedStartsAt;
}
