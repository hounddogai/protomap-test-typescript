import * as text from "../../../../kit/text.js";
import { ApprovalReservation } from "./approval-reservation.js";

/** How screens and exports show a approval reservation. */
export class ApprovalReservationView {
  codeText: string;
  title: string;
  versionText: string;
  utmSource: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    versionText: string,
    utmSource: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.versionText = versionText;
    this.utmSource = utmSource;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalReservationView(item: ApprovalReservation): ApprovalReservationView {
  return new ApprovalReservationView(
    item.code,
    text.truncate(item.title, 40),
    String(item.version),
    item.utmSource,
    text.truncate(item.source, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalReservationViews(items: ApprovalReservation[]): ApprovalReservationView[] {
  const views: ApprovalReservationView[] = [];
  for (const item of items) {
    views.push(toApprovalReservationView(item));
  }
  return views;
}

export function sumApprovalReservationView(view: ApprovalReservationView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedVersion;
}
