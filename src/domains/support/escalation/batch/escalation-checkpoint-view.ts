import * as text from "../../../../kit/text.js";
import { EscalationCheckpoint } from "./escalation-checkpoint.js";

/** How screens and exports show a escalation checkpoint. */
export class EscalationCheckpointView {
  code: string;
  label: string;
  archived: string;
  revisionText: string;
  maximum: string;
  clicks: string;
  quantityText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    revisionText: string,
    maximum: string,
    clicks: string,
    quantityText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.revisionText = revisionText;
    this.maximum = maximum;
    this.clicks = clicks;
    this.quantityText = quantityText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationCheckpointView(item: EscalationCheckpoint): EscalationCheckpointView {
  return new EscalationCheckpointView(
    text.truncate(item.code, 40),
    item.label,
    `${item.archived}`,
    String(item.revision),
    item.maximum.toFixed(2),
    String(item.clicks),
    String(item.quantity),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationCheckpointViews(items: EscalationCheckpoint[]): EscalationCheckpointView[] {
  const views: EscalationCheckpointView[] = [];
  for (const item of items) {
    views.push(toEscalationCheckpointView(item));
  }
  return views;
}

export function sumEscalationCheckpointView(view: EscalationCheckpointView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedRevision + parsedMaximum + parsedClicks;
}
