import * as text from "../../../../kit/text.js";
import { ManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

/** How screens and exports show a manual enrollment snapshot. */
export class ManualEnrollmentSnapshotView {
  code: string;
  labelText: string;
  visibleText: string;
  pinnedText: string;
  audienceId: string;
  sendAt: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    visibleText: string,
    pinnedText: string,
    audienceId: string,
    sendAt: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.visibleText = visibleText;
    this.pinnedText = pinnedText;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toManualEnrollmentSnapshotView(item: ManualEnrollmentSnapshot): ManualEnrollmentSnapshotView {
  return new ManualEnrollmentSnapshotView(
    item.code,
    item.label,
    `${item.visible}`,
    `${item.pinned}`,
    item.audienceId,
    String(item.sendAt),
    text.truncate(item.campaignRef, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualEnrollmentSnapshotViews(items: ManualEnrollmentSnapshot[]): ManualEnrollmentSnapshotView[] {
  const views: ManualEnrollmentSnapshotView[] = [];
  for (const item of items) {
    views.push(toManualEnrollmentSnapshotView(item));
  }
  return views;
}

export function sumManualEnrollmentSnapshotView(view: ManualEnrollmentSnapshotView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
