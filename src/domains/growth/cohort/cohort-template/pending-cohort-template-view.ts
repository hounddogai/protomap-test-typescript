import { PendingCohortTemplate } from "./pending-cohort-template.js";

/** How screens and exports show a pending cohort template. */
export class PendingCohortTemplateView {
  codeText: string;
  nameText: string;
  timezoneText: string;
  country: string;
  batchSize: string;
  quantity: string;
  expiresAt: string;
  label: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    timezoneText: string,
    country: string,
    batchSize: string,
    quantity: string,
    expiresAt: string,
    label: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.timezoneText = timezoneText;
    this.country = country;
    this.batchSize = batchSize;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.label = label;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCohortTemplateView(item: PendingCohortTemplate): PendingCohortTemplateView {
  return new PendingCohortTemplateView(
    item.code,
    item.name,
    item.timezone,
    item.country,
    String(item.batchSize),
    String(item.quantity),
    String(item.expiresAt),
    item.label,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCohortTemplateViews(items: PendingCohortTemplate[]): PendingCohortTemplateView[] {
  const views: PendingCohortTemplateView[] = [];
  for (const item of items) {
    views.push(toPendingCohortTemplateView(item));
  }
  return views;
}

export function sumPendingCohortTemplateView(view: PendingCohortTemplateView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedBatchSize + parsedQuantity + parsedExpiresAt;
}
