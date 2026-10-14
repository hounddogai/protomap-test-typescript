import * as text from "../../../../kit/text.js";
import { BatchedFlightBudget } from "./batched-flight-budget.js";

/** How screens and exports show a batched flight budget. */
export class BatchedFlightBudgetView {
  code: string;
  nameText: string;
  endsAt: string;
  approved: string;
  weight: string;
  localeText: string;
  timezone: string;
  versionText: string;
  country: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    endsAt: string,
    approved: string,
    weight: string,
    localeText: string,
    timezone: string,
    versionText: string,
    country: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.endsAt = endsAt;
    this.approved = approved;
    this.weight = weight;
    this.localeText = localeText;
    this.timezone = timezone;
    this.versionText = versionText;
    this.country = country;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFlightBudgetView(item: BatchedFlightBudget): BatchedFlightBudgetView {
  return new BatchedFlightBudgetView(
    text.truncate(item.code, 40),
    item.name,
    String(item.endsAt),
    `${item.approved}`,
    item.weight.toFixed(2),
    text.truncate(item.locale, 120),
    item.timezone,
    String(item.version),
    text.truncate(item.country, 120),
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFlightBudgetViews(items: BatchedFlightBudget[]): BatchedFlightBudgetView[] {
  const views: BatchedFlightBudgetView[] = [];
  for (const item of items) {
    views.push(toBatchedFlightBudgetView(item));
  }
  return views;
}

export function sumBatchedFlightBudgetView(view: BatchedFlightBudgetView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedEndsAt + parsedWeight + parsedVersion;
}
