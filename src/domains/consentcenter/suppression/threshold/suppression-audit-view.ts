import { SuppressionAudit } from "./suppression-audit.js";

/** How screens and exports show a suppression audit. */
export class SuppressionAuditView {
  codeText: string;
  labelText: string;
  limit: string;
  maximum: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    limit: string,
    maximum: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.limit = limit;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionAuditView(item: SuppressionAudit): SuppressionAuditView {
  return new SuppressionAuditView(
    item.code,
    item.label,
    String(item.limit),
    item.maximum.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionAuditViews(items: SuppressionAudit[]): SuppressionAuditView[] {
  const views: SuppressionAuditView[] = [];
  for (const item of items) {
    views.push(toSuppressionAuditView(item));
  }
  return views;
}

export function sumSuppressionAuditView(view: SuppressionAuditView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedLimit + parsedMaximum + parsedUpdatedAt;
}
