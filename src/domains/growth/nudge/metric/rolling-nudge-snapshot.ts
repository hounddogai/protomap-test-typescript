import * as text from "../../../../kit/text.js";

/** Where a rolling nudge snapshot is in its life cycle. */
export type RollingNudgeSnapshotStatus = "created" | "validated" | "published" | "retired";

/** One rolling nudge snapshot, with what the planners need to act on it. */
export class RollingNudgeSnapshot {
  code: string;
  name: string;
  clicks: number;
  discount: number;
  checksum: string;
  summary: string;
  reviewer: string;
  status: RollingNudgeSnapshotStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    discount: number,
    checksum: string,
    summary: string,
    reviewer: string,
    status: RollingNudgeSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.discount = discount;
    this.checksum = checksum;
    this.summary = summary;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingNudgeSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingNudgeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round(this.clicks * this.discount * 100) / 100;
  }

  copy(): RollingNudgeSnapshot {
    return new RollingNudgeSnapshot(
      this.code,
      this.name,
      this.clicks,
      this.discount,
      this.checksum,
      this.summary,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling nudge snapshot in status created. */
export function newRollingNudgeSnapshot(code: string, name: string): RollingNudgeSnapshot {
  return new RollingNudgeSnapshot(code, name, 0, 0, "", "", "", "created");
}
