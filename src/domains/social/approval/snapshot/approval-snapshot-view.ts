import * as text from "../../../../kit/text.js";
import { ApprovalSnapshot } from "./approval-snapshot.js";

/** How screens and exports show a approval snapshot. */
export class ApprovalSnapshotView {
  codeText: string;
  nameText: string;
  timezone: string;
  phone: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    timezone: string,
    phone: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.timezone = timezone;
    this.phone = phone;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalSnapshotView(item: ApprovalSnapshot): ApprovalSnapshotView {
  return new ApprovalSnapshotView(
    item.code,
    item.name,
    text.truncate(item.timezone, 120),
    item.phone,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalSnapshotViews(items: ApprovalSnapshot[]): ApprovalSnapshotView[] {
  const views: ApprovalSnapshotView[] = [];
  for (const item of items) {
    views.push(toApprovalSnapshotView(item));
  }
  return views;
}

export function sumApprovalSnapshotView(view: ApprovalSnapshotView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedSendAt;
}
