import { ReputationSnapshot } from "./reputation-snapshot.js";

/** How screens and exports show a reputation snapshot. */
export class ReputationSnapshotView {
  code: string;
  titleText: string;
  approved: string;
  cohortText: string;
  summaryText: string;
  createdAt: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    approved: string,
    cohortText: string,
    summaryText: string,
    createdAt: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.approved = approved;
    this.cohortText = cohortText;
    this.summaryText = summaryText;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toReputationSnapshotView(item: ReputationSnapshot): ReputationSnapshotView {
  return new ReputationSnapshotView(
    item.code,
    item.title,
    `${item.approved}`,
    item.cohort,
    item.summary,
    String(item.createdAt),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationSnapshotViews(items: ReputationSnapshot[]): ReputationSnapshotView[] {
  const views: ReputationSnapshotView[] = [];
  for (const item of items) {
    views.push(toReputationSnapshotView(item));
  }
  return views;
}

export function sumReputationSnapshotView(view: ReputationSnapshotView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
