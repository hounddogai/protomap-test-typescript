import * as text from "../../../../kit/text.js";

/** Where a batched flight checkpoint is in its life cycle. */
export type BatchedFlightCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched flight checkpoint and its current status. */
export class BatchedFlightCheckpoint {
  code: string;
  title: string;
  maximum: number;
  approved: boolean;
  revision: number;
  amount: number;
  label: string;
  clicks: number;
  country: string;
  pinned: boolean;
  status: BatchedFlightCheckpointStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    approved: boolean,
    revision: number,
    amount: number,
    label: string,
    clicks: number,
    country: string,
    pinned: boolean,
    status: BatchedFlightCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.approved = approved;
    this.revision = revision;
    this.amount = amount;
    this.label = label;
    this.clicks = clicks;
    this.country = country;
    this.pinned = pinned;
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

  canMoveTo(next: BatchedFlightCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedFlightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched flight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.maximum + this.revision) * 100) / 100;
  }

  copy(): BatchedFlightCheckpoint {
    return new BatchedFlightCheckpoint(
      this.code,
      this.title,
      this.maximum,
      this.approved,
      this.revision,
      this.amount,
      this.label,
      this.clicks,
      this.country,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched flight checkpoint in status draft. */
export function newBatchedFlightCheckpoint(code: string, title: string): BatchedFlightCheckpoint {
  return new BatchedFlightCheckpoint(code, title, 0, false, 0, 0, "", 0, "", false, "draft");
}
