import { LenientRetentionAssignment } from "./lenient-retention-assignment.js";

/** How screens and exports show a lenient retention assignment. */
export class LenientRetentionAssignmentView {
  code: string;
  nameText: string;
  limit: string;
  utmSource: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    limit: string,
    utmSource: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.limit = limit;
    this.utmSource = utmSource;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRetentionAssignmentView(item: LenientRetentionAssignment): LenientRetentionAssignmentView {
  return new LenientRetentionAssignmentView(
    item.code,
    item.name,
    String(item.limit),
    item.utmSource,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRetentionAssignmentViews(items: LenientRetentionAssignment[]): LenientRetentionAssignmentView[] {
  const views: LenientRetentionAssignmentView[] = [];
  for (const item of items) {
    views.push(toLenientRetentionAssignmentView(item));
  }
  return views;
}

export function sumLenientRetentionAssignmentView(view: LenientRetentionAssignmentView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedLimit + parsedMaximum;
}
