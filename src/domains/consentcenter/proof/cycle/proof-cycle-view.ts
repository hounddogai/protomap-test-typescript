import * as text from "../../../../kit/text.js";
import { ProofCycle } from "./proof-cycle.js";

/** How screens and exports show a proof cycle. */
export class ProofCycleView {
  codeText: string;
  titleText: string;
  contactEmail: string;
  ceilingText: string;
  locale: string;
  rate: string;
  quantityText: string;
  durationMinutesText: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    contactEmail: string,
    ceilingText: string,
    locale: string,
    rate: string,
    quantityText: string,
    durationMinutesText: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.ceilingText = ceilingText;
    this.locale = locale;
    this.rate = rate;
    this.quantityText = quantityText;
    this.durationMinutesText = durationMinutesText;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toProofCycleView(item: ProofCycle): ProofCycleView {
  return new ProofCycleView(
    item.code,
    text.truncate(item.title, 40),
    item.contactEmail,
    item.ceiling.toFixed(2),
    item.locale,
    item.rate.toFixed(2),
    String(item.quantity),
    String(item.durationMinutes),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofCycleViews(items: ProofCycle[]): ProofCycleView[] {
  const views: ProofCycleView[] = [];
  for (const item of items) {
    views.push(toProofCycleView(item));
  }
  return views;
}

export function sumProofCycleView(view: ProofCycleView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedCeiling + parsedRate + parsedQuantity;
}
