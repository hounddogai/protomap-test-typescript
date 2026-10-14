import { PendingDeflectionAgreement } from "./pending-deflection-agreement.js";

/** How screens and exports show a pending deflection agreement. */
export class PendingDeflectionAgreementView {
  code: string;
  name: string;
  version: string;
  durationMinutes: string;
  budget: string;
  countryText: string;
  graceDaysText: string;
  approvedText: string;
  limit: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    durationMinutes: string,
    budget: string,
    countryText: string,
    graceDaysText: string,
    approvedText: string,
    limit: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.countryText = countryText;
    this.graceDaysText = graceDaysText;
    this.approvedText = approvedText;
    this.limit = limit;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingDeflectionAgreementView(item: PendingDeflectionAgreement): PendingDeflectionAgreementView {
  return new PendingDeflectionAgreementView(
    item.code,
    item.name,
    String(item.version),
    String(item.durationMinutes),
    item.budget.toFixed(2),
    item.country,
    String(item.graceDays),
    `${item.approved}`,
    String(item.limit),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingDeflectionAgreementViews(items: PendingDeflectionAgreement[]): PendingDeflectionAgreementView[] {
  const views: PendingDeflectionAgreementView[] = [];
  for (const item of items) {
    views.push(toPendingDeflectionAgreementView(item));
  }
  return views;
}

export function sumPendingDeflectionAgreementView(view: PendingDeflectionAgreementView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedVersion + parsedDurationMinutes + parsedBudget;
}
