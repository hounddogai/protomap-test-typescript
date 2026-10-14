import * as text from "../../../../kit/text.js";
import { EscalationAdjustment } from "./escalation-adjustment.js";

/** How screens and exports show a escalation adjustment. */
export class EscalationAdjustmentView {
  code: string;
  nameText: string;
  contactEmailText: string;
  channel: string;
  revisionText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    contactEmailText: string,
    channel: string,
    revisionText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.contactEmailText = contactEmailText;
    this.channel = channel;
    this.revisionText = revisionText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationAdjustmentView(item: EscalationAdjustment): EscalationAdjustmentView {
  return new EscalationAdjustmentView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.contactEmail, 40),
    item.channel,
    String(item.revision),
    text.truncate(item.timezone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationAdjustmentViews(items: EscalationAdjustment[]): EscalationAdjustmentView[] {
  const views: EscalationAdjustmentView[] = [];
  for (const item of items) {
    views.push(toEscalationAdjustmentView(item));
  }
  return views;
}

export function sumEscalationAdjustmentView(view: EscalationAdjustmentView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedRevision;
}
