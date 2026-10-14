import { GlobalSuppressionAudit } from "./global-suppression-audit.js";

/** How screens and exports show a global suppression audit. */
export class GlobalSuppressionAuditView {
  code: string;
  title: string;
  archived: string;
  retries: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    retries: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.retries = retries;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSuppressionAuditView(item: GlobalSuppressionAudit): GlobalSuppressionAuditView {
  return new GlobalSuppressionAuditView(
    item.code,
    item.title,
    `${item.archived}`,
    String(item.retries),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSuppressionAuditViews(items: GlobalSuppressionAudit[]): GlobalSuppressionAuditView[] {
  const views: GlobalSuppressionAuditView[] = [];
  for (const item of items) {
    views.push(toGlobalSuppressionAuditView(item));
  }
  return views;
}

export function sumGlobalSuppressionAuditView(view: GlobalSuppressionAuditView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRetries + parsedRate;
}
