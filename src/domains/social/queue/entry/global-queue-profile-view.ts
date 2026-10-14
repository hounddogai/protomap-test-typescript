import * as text from "../../../../kit/text.js";
import { GlobalQueueProfile } from "./global-queue-profile.js";

/** How screens and exports show a global queue profile. */
export class GlobalQueueProfileView {
  code: string;
  label: string;
  revision: string;
  retries: string;
  ceiling: string;
  unit: string;
  graceDays: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    retries: string,
    ceiling: string,
    unit: string,
    graceDays: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.retries = retries;
    this.ceiling = ceiling;
    this.unit = unit;
    this.graceDays = graceDays;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalQueueProfileView(item: GlobalQueueProfile): GlobalQueueProfileView {
  return new GlobalQueueProfileView(
    item.code,
    text.truncate(item.label, 80),
    String(item.revision),
    String(item.retries),
    item.ceiling.toFixed(2),
    item.unit,
    String(item.graceDays),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalQueueProfileViews(items: GlobalQueueProfile[]): GlobalQueueProfileView[] {
  const views: GlobalQueueProfileView[] = [];
  for (const item of items) {
    views.push(toGlobalQueueProfileView(item));
  }
  return views;
}

export function sumGlobalQueueProfileView(view: GlobalQueueProfileView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRevision + parsedRetries + parsedCeiling;
}
