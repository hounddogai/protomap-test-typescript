import * as text from "../../../../kit/text.js";
import { EscalationSegment } from "./escalation-segment.js";

/** How screens and exports show a escalation segment. */
export class EscalationSegmentView {
  code: string;
  name: string;
  thresholdText: string;
  contactEmail: string;
  campaignRefText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    thresholdText: string,
    contactEmail: string,
    campaignRefText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.thresholdText = thresholdText;
    this.contactEmail = contactEmail;
    this.campaignRefText = campaignRefText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationSegmentView(item: EscalationSegment): EscalationSegmentView {
  return new EscalationSegmentView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    item.contactEmail,
    text.truncate(item.campaignRef, 40),
    text.truncate(item.ownerId, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationSegmentViews(items: EscalationSegment[]): EscalationSegmentView[] {
  const views: EscalationSegmentView[] = [];
  for (const item of items) {
    views.push(toEscalationSegmentView(item));
  }
  return views;
}

export function sumEscalationSegmentView(view: EscalationSegmentView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedThreshold;
}
