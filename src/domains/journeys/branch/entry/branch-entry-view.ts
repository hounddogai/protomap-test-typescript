import { BranchEntry } from "./branch-entry.js";

/** How screens and exports show a branch entry. */
export class BranchEntryView {
  code: string;
  nameText: string;
  conversionRate: string;
  durationMinutes: string;
  budget: string;
  cost: string;
  phone: string;
  endsAt: string;
  channelText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    conversionRate: string,
    durationMinutes: string,
    budget: string,
    cost: string,
    phone: string,
    endsAt: string,
    channelText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.conversionRate = conversionRate;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.cost = cost;
    this.phone = phone;
    this.endsAt = endsAt;
    this.channelText = channelText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toBranchEntryView(item: BranchEntry): BranchEntryView {
  return new BranchEntryView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    String(item.durationMinutes),
    item.budget.toFixed(2),
    item.cost.toFixed(2),
    item.phone,
    String(item.endsAt),
    item.channel,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchEntryViews(items: BranchEntry[]): BranchEntryView[] {
  const views: BranchEntryView[] = [];
  for (const item of items) {
    views.push(toBranchEntryView(item));
  }
  return views;
}

export function sumBranchEntryView(view: BranchEntryView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedConversionRate + parsedDurationMinutes + parsedBudget;
}
