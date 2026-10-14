import * as text from "../../../../kit/text.js";
import { GlobalApprovalRecord } from "./global-approval-record.js";

/** How screens and exports show a global approval record. */
export class GlobalApprovalRecordView {
  code: string;
  name: string;
  reviewer: string;
  versionText: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    versionText: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.versionText = versionText;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalApprovalRecordView(item: GlobalApprovalRecord): GlobalApprovalRecordView {
  return new GlobalApprovalRecordView(
    text.truncate(item.code, 120),
    item.name,
    item.reviewer,
    String(item.version),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalApprovalRecordViews(items: GlobalApprovalRecord[]): GlobalApprovalRecordView[] {
  const views: GlobalApprovalRecordView[] = [];
  for (const item of items) {
    views.push(toGlobalApprovalRecordView(item));
  }
  return views;
}

export function sumGlobalApprovalRecordView(view: GlobalApprovalRecordView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedVersion + parsedBid;
}
