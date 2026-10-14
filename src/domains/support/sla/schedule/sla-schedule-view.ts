import * as text from "../../../../kit/text.js";
import { SlaSchedule } from "./sla-schedule.js";

/** How screens and exports show a sla schedule. */
export class SlaScheduleView {
  code: string;
  name: string;
  impressions: string;
  version: string;
  unitText: string;
  budget: string;
  minimum: string;
  currency: string;
  priority: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    impressions: string,
    version: string,
    unitText: string,
    budget: string,
    minimum: string,
    currency: string,
    priority: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.version = version;
    this.unitText = unitText;
    this.budget = budget;
    this.minimum = minimum;
    this.currency = currency;
    this.priority = priority;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaScheduleView(item: SlaSchedule): SlaScheduleView {
  return new SlaScheduleView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    String(item.impressions),
    String(item.version),
    text.truncate(item.unit, 40),
    item.budget.toFixed(2),
    item.minimum.toFixed(2),
    item.currency,
    String(item.priority),
    text.truncate(item.ownerId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaScheduleViews(items: SlaSchedule[]): SlaScheduleView[] {
  const views: SlaScheduleView[] = [];
  for (const item of items) {
    views.push(toSlaScheduleView(item));
  }
  return views;
}

export function sumSlaScheduleView(view: SlaScheduleView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedImpressions + parsedVersion + parsedBudget;
}
