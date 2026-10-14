import * as text from "../../../../kit/text.js";
import { DefaultDeflectionBudget } from "./default-deflection-budget.js";

/** How screens and exports show a default deflection budget. */
export class DefaultDeflectionBudgetView {
  code: string;
  label: string;
  ratio: string;
  region: string;
  revisionText: string;
  visible: string;
  openRateText: string;
  contactEmail: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ratio: string,
    region: string,
    revisionText: string,
    visible: string,
    openRateText: string,
    contactEmail: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.region = region;
    this.revisionText = revisionText;
    this.visible = visible;
    this.openRateText = openRateText;
    this.contactEmail = contactEmail;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultDeflectionBudgetView(item: DefaultDeflectionBudget): DefaultDeflectionBudgetView {
  return new DefaultDeflectionBudgetView(
    text.truncate(item.code, 40),
    item.label,
    item.ratio.toFixed(2),
    item.region,
    String(item.revision),
    `${item.visible}`,
    item.openRate.toFixed(2),
    text.truncate(item.contactEmail, 40),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultDeflectionBudgetViews(items: DefaultDeflectionBudget[]): DefaultDeflectionBudgetView[] {
  const views: DefaultDeflectionBudgetView[] = [];
  for (const item of items) {
    views.push(toDefaultDeflectionBudgetView(item));
  }
  return views;
}

export function sumDefaultDeflectionBudgetView(view: DefaultDeflectionBudgetView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedRatio + parsedRevision + parsedOpenRate;
}
