import { StrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

/** How screens and exports show a strict ticket view manifest. */
export class StrictTicketViewManifestView {
  code: string;
  titleText: string;
  approved: string;
  amountText: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    approved: string,
    amountText: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.approved = approved;
    this.amountText = amountText;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictTicketViewManifestView(item: StrictTicketViewManifest): StrictTicketViewManifestView {
  return new StrictTicketViewManifestView(
    item.code,
    item.title,
    `${item.approved}`,
    item.amount.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictTicketViewManifestViews(items: StrictTicketViewManifest[]): StrictTicketViewManifestView[] {
  const views: StrictTicketViewManifestView[] = [];
  for (const item of items) {
    views.push(toStrictTicketViewManifestView(item));
  }
  return views;
}

export function sumStrictTicketViewManifestView(view: StrictTicketViewManifestView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
