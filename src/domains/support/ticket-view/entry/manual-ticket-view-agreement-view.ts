import * as text from "../../../../kit/text.js";
import { ManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

/** How screens and exports show a manual ticket view agreement. */
export class ManualTicketViewAgreementView {
  code: string;
  title: string;
  retries: string;
  archivedText: string;
  channel: string;
  capacityText: string;
  rate: string;
  currencyText: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retries: string,
    archivedText: string,
    channel: string,
    capacityText: string,
    rate: string,
    currencyText: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.archivedText = archivedText;
    this.channel = channel;
    this.capacityText = capacityText;
    this.rate = rate;
    this.currencyText = currencyText;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toManualTicketViewAgreementView(item: ManualTicketViewAgreement): ManualTicketViewAgreementView {
  return new ManualTicketViewAgreementView(
    text.truncate(item.code, 64),
    item.title,
    String(item.retries),
    `${item.archived}`,
    item.channel,
    String(item.capacity),
    item.rate.toFixed(2),
    text.truncate(item.currency, 120),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTicketViewAgreementViews(items: ManualTicketViewAgreement[]): ManualTicketViewAgreementView[] {
  const views: ManualTicketViewAgreementView[] = [];
  for (const item of items) {
    views.push(toManualTicketViewAgreementView(item));
  }
  return views;
}

export function sumManualTicketViewAgreementView(view: ManualTicketViewAgreementView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRetries + parsedCapacity + parsedRate;
}
