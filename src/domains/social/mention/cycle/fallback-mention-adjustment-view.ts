import * as text from "../../../../kit/text.js";
import { FallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

/** How screens and exports show a fallback mention adjustment. */
export class FallbackMentionAdjustmentView {
  codeText: string;
  labelText: string;
  phoneText: string;
  revision: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    phoneText: string,
    revision: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.phoneText = phoneText;
    this.revision = revision;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackMentionAdjustmentView(item: FallbackMentionAdjustment): FallbackMentionAdjustmentView {
  return new FallbackMentionAdjustmentView(
    text.truncate(item.code, 64),
    item.label,
    item.phone,
    String(item.revision),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackMentionAdjustmentViews(items: FallbackMentionAdjustment[]): FallbackMentionAdjustmentView[] {
  const views: FallbackMentionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toFallbackMentionAdjustmentView(item));
  }
  return views;
}

export function sumFallbackMentionAdjustmentView(view: FallbackMentionAdjustmentView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
