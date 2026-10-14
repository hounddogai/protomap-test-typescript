import { DefaultCsatTemplate } from "./default-csat-template.js";

/** How screens and exports show a default csat template. */
export class DefaultCsatTemplateView {
  codeText: string;
  name: string;
  openRate: string;
  budgetText: string;
  retries: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    openRate: string,
    budgetText: string,
    retries: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.openRate = openRate;
    this.budgetText = budgetText;
    this.retries = retries;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCsatTemplateView(item: DefaultCsatTemplate): DefaultCsatTemplateView {
  return new DefaultCsatTemplateView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    String(item.retries),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCsatTemplateViews(items: DefaultCsatTemplate[]): DefaultCsatTemplateView[] {
  const views: DefaultCsatTemplateView[] = [];
  for (const item of items) {
    views.push(toDefaultCsatTemplateView(item));
  }
  return views;
}

export function sumDefaultCsatTemplateView(view: DefaultCsatTemplateView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedOpenRate + parsedBudget + parsedRetries;
}
