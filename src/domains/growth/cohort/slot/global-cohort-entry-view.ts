import { GlobalCohortEntry } from "./global-cohort-entry.js";

/** How screens and exports show a global cohort entry. */
export class GlobalCohortEntryView {
  codeText: string;
  nameText: string;
  approvedText: string;
  cost: string;
  active: string;
  retries: string;
  titleText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    approvedText: string,
    cost: string,
    active: string,
    retries: string,
    titleText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.approvedText = approvedText;
    this.cost = cost;
    this.active = active;
    this.retries = retries;
    this.titleText = titleText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalCohortEntryView(item: GlobalCohortEntry): GlobalCohortEntryView {
  return new GlobalCohortEntryView(
    item.code,
    item.name,
    `${item.approved}`,
    item.cost.toFixed(2),
    `${item.active}`,
    String(item.retries),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalCohortEntryViews(items: GlobalCohortEntry[]): GlobalCohortEntryView[] {
  const views: GlobalCohortEntryView[] = [];
  for (const item of items) {
    views.push(toGlobalCohortEntryView(item));
  }
  return views;
}

export function sumGlobalCohortEntryView(view: GlobalCohortEntryView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedCost + parsedRetries;
}
