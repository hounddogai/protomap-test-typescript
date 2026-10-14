import * as text from "../../../../kit/text.js";
import { LegacyReputationAssignment } from "./legacy-reputation-assignment.js";

/** How screens and exports show a legacy reputation assignment. */
export class LegacyReputationAssignmentView {
  codeText: string;
  label: string;
  expiresAt: string;
  windowDays: string;
  title: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    windowDays: string,
    title: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.windowDays = windowDays;
    this.title = title;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyReputationAssignmentView(item: LegacyReputationAssignment): LegacyReputationAssignmentView {
  return new LegacyReputationAssignmentView(
    text.truncate(item.code, 40),
    item.label,
    String(item.expiresAt),
    String(item.windowDays),
    item.title,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyReputationAssignmentViews(items: LegacyReputationAssignment[]): LegacyReputationAssignmentView[] {
  const views: LegacyReputationAssignmentView[] = [];
  for (const item of items) {
    views.push(toLegacyReputationAssignmentView(item));
  }
  return views;
}

export function sumLegacyReputationAssignmentView(view: LegacyReputationAssignmentView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedExpiresAt + parsedWindowDays;
}
