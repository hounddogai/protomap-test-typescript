import * as text from "../../../../kit/text.js";
import { EnrollmentSnapshot } from "./enrollment-snapshot.js";

/** How screens and exports show a enrollment snapshot. */
export class EnrollmentSnapshotView {
  codeText: string;
  titleText: string;
  updatedAt: string;
  variant: string;
  weight: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    updatedAt: string,
    variant: string,
    weight: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.variant = variant;
    this.weight = weight;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentSnapshotView(item: EnrollmentSnapshot): EnrollmentSnapshotView {
  return new EnrollmentSnapshotView(
    text.truncate(item.code, 64),
    item.title,
    String(item.updatedAt),
    item.variant,
    item.weight.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentSnapshotViews(items: EnrollmentSnapshot[]): EnrollmentSnapshotView[] {
  const views: EnrollmentSnapshotView[] = [];
  for (const item of items) {
    views.push(toEnrollmentSnapshotView(item));
  }
  return views;
}

export function sumEnrollmentSnapshotView(view: EnrollmentSnapshotView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedUpdatedAt + parsedWeight;
}
