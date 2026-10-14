import * as text from "../../../../kit/text.js";

/** Where a batched flight snapshot is in its life cycle. */
export type BatchedFlightSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched flight snapshot. Its code is unique within a tenant. */
export class BatchedFlightSnapshot {
  code: string;
  name: string;
  checksum: string;
  title: string;
  category: string;
  minimum: number;
  reviewer: string;
  retries: number;
  impressions: number;
  revision: number;
  cost: number;
  status: BatchedFlightSnapshotStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    title: string,
    category: string,
    minimum: number,
    reviewer: string,
    retries: number,
    impressions: number,
    revision: number,
    cost: number,
    status: BatchedFlightSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.title = title;
    this.category = category;
    this.minimum = minimum;
    this.reviewer = reviewer;
    this.retries = retries;
    this.impressions = impressions;
    this.revision = revision;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedFlightSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedFlightSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched flight snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round(this.impressions * this.cost * 100) / 100;
  }

  copy(): BatchedFlightSnapshot {
    return new BatchedFlightSnapshot(
      this.code,
      this.name,
      this.checksum,
      this.title,
      this.category,
      this.minimum,
      this.reviewer,
      this.retries,
      this.impressions,
      this.revision,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched flight snapshot in status draft. */
export function newBatchedFlightSnapshot(code: string, name: string): BatchedFlightSnapshot {
  return new BatchedFlightSnapshot(code, name, "", "", "", 0, "", 0, 0, 0, 0, "draft");
}
