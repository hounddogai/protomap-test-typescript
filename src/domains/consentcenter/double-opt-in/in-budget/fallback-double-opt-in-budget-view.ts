import * as text from "../../../../kit/text.js";
import { FallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

/** How screens and exports show a fallback double opt in budget. */
export class FallbackDoubleOptInBudgetView {
  code: string;
  nameText: string;
  durationMinutes: string;
  phone: string;
  checksum: string;
  batchSize: string;
  timezoneText: string;
  label: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    durationMinutes: string,
    phone: string,
    checksum: string,
    batchSize: string,
    timezoneText: string,
    label: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.durationMinutes = durationMinutes;
    this.phone = phone;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.timezoneText = timezoneText;
    this.label = label;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackDoubleOptInBudgetView(item: FallbackDoubleOptInBudget): FallbackDoubleOptInBudgetView {
  return new FallbackDoubleOptInBudgetView(
    item.code,
    text.truncate(item.name, 64),
    String(item.durationMinutes),
    item.phone,
    item.checksum,
    String(item.batchSize),
    text.truncate(item.timezone, 80),
    item.label,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackDoubleOptInBudgetViews(items: FallbackDoubleOptInBudget[]): FallbackDoubleOptInBudgetView[] {
  const views: FallbackDoubleOptInBudgetView[] = [];
  for (const item of items) {
    views.push(toFallbackDoubleOptInBudgetView(item));
  }
  return views;
}

export function sumFallbackDoubleOptInBudgetView(view: FallbackDoubleOptInBudgetView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedDurationMinutes + parsedBatchSize + parsedEndsAt;
}
