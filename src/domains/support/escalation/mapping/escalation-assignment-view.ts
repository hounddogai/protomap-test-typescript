import * as text from "../../../../kit/text.js";
import { EscalationAssignment } from "./escalation-assignment.js";

/** How screens and exports show a escalation assignment. */
export class EscalationAssignmentView {
  code: string;
  title: string;
  label: string;
  impressionsText: string;
  phoneText: string;
  endsAt: string;
  versionText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    label: string,
    impressionsText: string,
    phoneText: string,
    endsAt: string,
    versionText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.impressionsText = impressionsText;
    this.phoneText = phoneText;
    this.endsAt = endsAt;
    this.versionText = versionText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationAssignmentView(item: EscalationAssignment): EscalationAssignmentView {
  return new EscalationAssignmentView(
    item.code,
    text.truncate(item.title, 120),
    item.label,
    String(item.impressions),
    item.phone,
    String(item.endsAt),
    String(item.version),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationAssignmentViews(items: EscalationAssignment[]): EscalationAssignmentView[] {
  const views: EscalationAssignmentView[] = [];
  for (const item of items) {
    views.push(toEscalationAssignmentView(item));
  }
  return views;
}

export function sumEscalationAssignmentView(view: EscalationAssignmentView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedImpressions + parsedEndsAt + parsedVersion;
}
