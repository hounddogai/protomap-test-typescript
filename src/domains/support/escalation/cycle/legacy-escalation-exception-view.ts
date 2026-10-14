import * as text from "../../../../kit/text.js";
import { LegacyEscalationException } from "./legacy-escalation-exception.js";

/** How screens and exports show a legacy escalation exception. */
export class LegacyEscalationExceptionView {
  codeText: string;
  titleText: string;
  frequencyCap: string;
  approvedText: string;
  sequence: string;
  nameText: string;
  utmSource: string;
  capacityText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    frequencyCap: string,
    approvedText: string,
    sequence: string,
    nameText: string,
    utmSource: string,
    capacityText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.approvedText = approvedText;
    this.sequence = sequence;
    this.nameText = nameText;
    this.utmSource = utmSource;
    this.capacityText = capacityText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyEscalationExceptionView(item: LegacyEscalationException): LegacyEscalationExceptionView {
  return new LegacyEscalationExceptionView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 40),
    String(item.frequencyCap),
    `${item.approved}`,
    String(item.sequence),
    item.name,
    text.truncate(item.utmSource, 40),
    String(item.capacity),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyEscalationExceptionViews(items: LegacyEscalationException[]): LegacyEscalationExceptionView[] {
  const views: LegacyEscalationExceptionView[] = [];
  for (const item of items) {
    views.push(toLegacyEscalationExceptionView(item));
  }
  return views;
}

export function sumLegacyEscalationExceptionView(view: LegacyEscalationExceptionView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedFrequencyCap + parsedSequence + parsedCapacity;
}
