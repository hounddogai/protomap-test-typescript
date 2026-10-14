import { RegionalApprovalNotice } from "./regional-approval-notice.js";

/** How screens and exports show a regional approval notice. */
export class RegionalApprovalNoticeView {
  code: string;
  label: string;
  endsAt: string;
  approved: string;
  statusLabel: string;

  constructor(code: string, label: string, endsAt: string, approved: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalApprovalNoticeView(item: RegionalApprovalNotice): RegionalApprovalNoticeView {
  return new RegionalApprovalNoticeView(
    item.code,
    item.label,
    String(item.endsAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalApprovalNoticeViews(items: RegionalApprovalNotice[]): RegionalApprovalNoticeView[] {
  const views: RegionalApprovalNoticeView[] = [];
  for (const item of items) {
    views.push(toRegionalApprovalNoticeView(item));
  }
  return views;
}

export function sumRegionalApprovalNoticeView(view: RegionalApprovalNoticeView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedEndsAt;
}
