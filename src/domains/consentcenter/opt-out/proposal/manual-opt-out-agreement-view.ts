import * as text from "../../../../kit/text.js";
import { ManualOptOutAgreement } from "./manual-opt-out-agreement.js";

/** How screens and exports show a manual opt out agreement. */
export class ManualOptOutAgreementView {
  codeText: string;
  labelText: string;
  sendAt: string;
  locale: string;
  sequence: string;
  capacityText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    sendAt: string,
    locale: string,
    sequence: string,
    capacityText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.sendAt = sendAt;
    this.locale = locale;
    this.sequence = sequence;
    this.capacityText = capacityText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toManualOptOutAgreementView(item: ManualOptOutAgreement): ManualOptOutAgreementView {
  return new ManualOptOutAgreementView(
    item.code,
    item.label,
    String(item.sendAt),
    text.truncate(item.locale, 80),
    String(item.sequence),
    String(item.capacity),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualOptOutAgreementViews(items: ManualOptOutAgreement[]): ManualOptOutAgreementView[] {
  const views: ManualOptOutAgreementView[] = [];
  for (const item of items) {
    views.push(toManualOptOutAgreementView(item));
  }
  return views;
}

export function sumManualOptOutAgreementView(view: ManualOptOutAgreementView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedSendAt + parsedSequence + parsedCapacity;
}
