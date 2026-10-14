import * as text from "../../../../kit/text.js";
import { ApprovalNotice } from "./approval-notice.js";

/** How screens and exports show a approval notice. */
export class ApprovalNoticeView {
  codeText: string;
  labelText: string;
  thresholdText: string;
  campaignRefText: string;
  source: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    thresholdText: string,
    campaignRefText: string,
    source: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.thresholdText = thresholdText;
    this.campaignRefText = campaignRefText;
    this.source = source;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalNoticeView(item: ApprovalNotice): ApprovalNoticeView {
  return new ApprovalNoticeView(
    text.truncate(item.code, 80),
    item.label,
    item.threshold.toFixed(2),
    item.campaignRef,
    item.source,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalNoticeViews(items: ApprovalNotice[]): ApprovalNoticeView[] {
  const views: ApprovalNoticeView[] = [];
  for (const item of items) {
    views.push(toApprovalNoticeView(item));
  }
  return views;
}

export function sumApprovalNoticeView(view: ApprovalNoticeView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedThreshold;
}
