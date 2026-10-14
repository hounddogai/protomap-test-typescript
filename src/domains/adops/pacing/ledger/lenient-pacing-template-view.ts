import * as text from "../../../../kit/text.js";
import { LenientPacingTemplate } from "./lenient-pacing-template.js";

/** How screens and exports show a lenient pacing template. */
export class LenientPacingTemplateView {
  code: string;
  label: string;
  expiresAt: string;
  bid: string;
  revision: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    expiresAt: string,
    bid: string,
    revision: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.bid = bid;
    this.revision = revision;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPacingTemplateView(item: LenientPacingTemplate): LenientPacingTemplateView {
  return new LenientPacingTemplateView(
    text.truncate(item.code, 80),
    item.label,
    String(item.expiresAt),
    item.bid.toFixed(2),
    String(item.revision),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPacingTemplateViews(items: LenientPacingTemplate[]): LenientPacingTemplateView[] {
  const views: LenientPacingTemplateView[] = [];
  for (const item of items) {
    views.push(toLenientPacingTemplateView(item));
  }
  return views;
}

export function sumLenientPacingTemplateView(view: LenientPacingTemplateView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedExpiresAt + parsedBid + parsedRevision;
}
