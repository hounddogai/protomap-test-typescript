import * as text from "../../../../kit/text.js";
import { PlacementAgreement } from "./placement-agreement.js";

/** How screens and exports show a placement agreement. */
export class PlacementAgreementView {
  code: string;
  label: string;
  retries: string;
  revision: string;
  frequencyCapText: string;
  contactEmail: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    revision: string,
    frequencyCapText: string,
    contactEmail: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.revision = revision;
    this.frequencyCapText = frequencyCapText;
    this.contactEmail = contactEmail;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementAgreementView(item: PlacementAgreement): PlacementAgreementView {
  return new PlacementAgreementView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    String(item.retries),
    String(item.revision),
    String(item.frequencyCap),
    item.contactEmail,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementAgreementViews(items: PlacementAgreement[]): PlacementAgreementView[] {
  const views: PlacementAgreementView[] = [];
  for (const item of items) {
    views.push(toPlacementAgreementView(item));
  }
  return views;
}

export function sumPlacementAgreementView(view: PlacementAgreementView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedRetries + parsedRevision + parsedFrequencyCap;
}
