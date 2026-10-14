import { ManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

/** How screens and exports show a manual touchpoint assignment. */
export class ManualTouchpointAssignmentView {
  code: string;
  nameText: string;
  summary: string;
  campaignRefText: string;
  locale: string;
  retries: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    summary: string,
    campaignRefText: string,
    locale: string,
    retries: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.summary = summary;
    this.campaignRefText = campaignRefText;
    this.locale = locale;
    this.retries = retries;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toManualTouchpointAssignmentView(item: ManualTouchpointAssignment): ManualTouchpointAssignmentView {
  return new ManualTouchpointAssignmentView(
    item.code,
    item.name,
    item.summary,
    item.campaignRef,
    item.locale,
    String(item.retries),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTouchpointAssignmentViews(items: ManualTouchpointAssignment[]): ManualTouchpointAssignmentView[] {
  const views: ManualTouchpointAssignmentView[] = [];
  for (const item of items) {
    views.push(toManualTouchpointAssignmentView(item));
  }
  return views;
}

export function sumManualTouchpointAssignmentView(view: ManualTouchpointAssignmentView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
