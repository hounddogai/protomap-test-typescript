import { FrequencyNotice } from "./frequency-notice.js";

/** How screens and exports show a frequency notice. */
export class FrequencyNoticeView {
  code: string;
  labelText: string;
  budget: string;
  createdAt: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    budget: string,
    createdAt: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.budget = budget;
    this.createdAt = createdAt;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyNoticeView(item: FrequencyNotice): FrequencyNoticeView {
  return new FrequencyNoticeView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.createdAt),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyNoticeViews(items: FrequencyNotice[]): FrequencyNoticeView[] {
  const views: FrequencyNoticeView[] = [];
  for (const item of items) {
    views.push(toFrequencyNoticeView(item));
  }
  return views;
}

export function sumFrequencyNoticeView(view: FrequencyNoticeView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBudget + parsedCreatedAt;
}
