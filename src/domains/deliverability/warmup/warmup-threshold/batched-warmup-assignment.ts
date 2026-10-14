import * as text from "../../../../kit/text.js";

/** Where a batched warmup assignment is in its life cycle. */
export type BatchedWarmupAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched warmup assignment as the warmup team keeps it. */
export class BatchedWarmupAssignment {
  code: string;
  label: string;
  openRate: number;
  cost: number;
  maximum: number;
  attempts: number;
  threshold: number;
  startsAt: number;
  currency: string;
  status: BatchedWarmupAssignmentStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    cost: number,
    maximum: number,
    attempts: number,
    threshold: number,
    startsAt: number,
    currency: string,
    status: BatchedWarmupAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.cost = cost;
    this.maximum = maximum;
    this.attempts = attempts;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedWarmupAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedWarmupAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched warmup assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.cost + this.maximum) * 100) / 100;
  }

  copy(): BatchedWarmupAssignment {
    return new BatchedWarmupAssignment(
      this.code,
      this.label,
      this.openRate,
      this.cost,
      this.maximum,
      this.attempts,
      this.threshold,
      this.startsAt,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched warmup assignment in status proposed. */
export function newBatchedWarmupAssignment(code: string, label: string): BatchedWarmupAssignment {
  return new BatchedWarmupAssignment(code, label, 0, 0, 0, 0, 0, 0, "", "proposed");
}
