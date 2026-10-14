import * as text from "../../../../kit/text.js";
import { SeasonalDomainAgreement } from "./seasonal-domain-agreement.js";

/** How screens and exports show a seasonal domain agreement. */
export class SeasonalDomainAgreementView {
  code: string;
  title: string;
  durationMinutesText: string;
  quantity: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutesText: string,
    quantity: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutesText = durationMinutesText;
    this.quantity = quantity;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDomainAgreementView(item: SeasonalDomainAgreement): SeasonalDomainAgreementView {
  return new SeasonalDomainAgreementView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 64),
    String(item.durationMinutes),
    String(item.quantity),
    text.truncate(item.notes, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDomainAgreementViews(items: SeasonalDomainAgreement[]): SeasonalDomainAgreementView[] {
  const views: SeasonalDomainAgreementView[] = [];
  for (const item of items) {
    views.push(toSeasonalDomainAgreementView(item));
  }
  return views;
}

export function sumSeasonalDomainAgreementView(view: SeasonalDomainAgreementView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedDurationMinutes + parsedQuantity;
}
