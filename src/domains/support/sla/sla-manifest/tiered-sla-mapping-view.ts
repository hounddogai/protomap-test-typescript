import * as text from "../../../../kit/text.js";
import { TieredSlaMapping } from "./tiered-sla-mapping.js";

/** How screens and exports show a tiered sla mapping. */
export class TieredSlaMappingView {
  code: string;
  title: string;
  audienceIdText: string;
  localeText: string;
  budgetText: string;
  notes: string;
  createdAt: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceIdText: string,
    localeText: string,
    budgetText: string,
    notes: string,
    createdAt: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceIdText = audienceIdText;
    this.localeText = localeText;
    this.budgetText = budgetText;
    this.notes = notes;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSlaMappingView(item: TieredSlaMapping): TieredSlaMappingView {
  return new TieredSlaMappingView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.audienceId, 80),
    item.locale,
    item.budget.toFixed(2),
    item.notes,
    String(item.createdAt),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSlaMappingViews(items: TieredSlaMapping[]): TieredSlaMappingView[] {
  const views: TieredSlaMappingView[] = [];
  for (const item of items) {
    views.push(toTieredSlaMappingView(item));
  }
  return views;
}

export function sumTieredSlaMappingView(view: TieredSlaMappingView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBudget + parsedCreatedAt + parsedDurationMinutes;
}
