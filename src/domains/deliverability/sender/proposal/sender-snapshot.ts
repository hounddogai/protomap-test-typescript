import * as text from "../../../../kit/text.js";

/** Where a sender snapshot is in its life cycle. */
export type SenderSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One sender snapshot, with what the planners need to act on it. */
export class SenderSnapshot {
  code: string;
  label: string;
  pinned: boolean;
  createdAt: number;
  bid: number;
  limit: number;
  segment: string;
  cohort: string;
  status: SenderSnapshotStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    createdAt: number,
    bid: number,
    limit: number,
    segment: string,
    cohort: string,
    status: SenderSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.bid = bid;
    this.limit = limit;
    this.segment = segment;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.createdAt * this.limit * 100) / 100;
  }

  copy(): SenderSnapshot {
    return new SenderSnapshot(
      this.code,
      this.label,
      this.pinned,
      this.createdAt,
      this.bid,
      this.limit,
      this.segment,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sender snapshot in status open. */
export function newSenderSnapshot(code: string, label: string): SenderSnapshot {
  return new SenderSnapshot(code, label, false, 0, 0, 0, "", "", "open");
}
