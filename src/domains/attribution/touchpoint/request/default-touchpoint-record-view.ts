import { DefaultTouchpointRecord } from "./default-touchpoint-record.js";

/** How screens and exports show a default touchpoint record. */
export class DefaultTouchpointRecordView {
  code: string;
  title: string;
  localeText: string;
  priority: string;
  retries: string;
  labelText: string;
  ownerId: string;
  active: string;
  conversionRate: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    localeText: string,
    priority: string,
    retries: string,
    labelText: string,
    ownerId: string,
    active: string,
    conversionRate: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.localeText = localeText;
    this.priority = priority;
    this.retries = retries;
    this.labelText = labelText;
    this.ownerId = ownerId;
    this.active = active;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultTouchpointRecordView(item: DefaultTouchpointRecord): DefaultTouchpointRecordView {
  return new DefaultTouchpointRecordView(
    item.code,
    item.title,
    item.locale,
    String(item.priority),
    String(item.retries),
    item.label,
    item.ownerId,
    `${item.active}`,
    item.conversionRate.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultTouchpointRecordViews(items: DefaultTouchpointRecord[]): DefaultTouchpointRecordView[] {
  const views: DefaultTouchpointRecordView[] = [];
  for (const item of items) {
    views.push(toDefaultTouchpointRecordView(item));
  }
  return views;
}

export function sumDefaultTouchpointRecordView(view: DefaultTouchpointRecordView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedPriority + parsedRetries + parsedConversionRate;
}
