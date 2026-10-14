import * as text from "../../../../kit/text.js";

/** Where a reputation snapshot is in its life cycle. */
export type ReputationSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reputation snapshot as the reputation team keeps it. */
export class ReputationSnapshot {
  code: string;
  title: string;
  approved: boolean;
  cohort: string;
  summary: string;
  createdAt: number;
  ownerId: string;
  status: ReputationSnapshotStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    cohort: string,
    summary: string,
    createdAt: number,
    ownerId: string,
    status: ReputationSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.cohort = cohort;
    this.summary = summary;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): ReputationSnapshot {
    return new ReputationSnapshot(
      this.code,
      this.title,
      this.approved,
      this.cohort,
      this.summary,
      this.createdAt,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation snapshot in status new. */
export function newReputationSnapshot(code: string, title: string): ReputationSnapshot {
  return new ReputationSnapshot(code, title, false, "", "", 0, "", "new");
}
