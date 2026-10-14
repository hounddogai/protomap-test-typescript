import * as text from "../../../../kit/text.js";

/** Where a batched activation schedule is in its life cycle. */
export type BatchedActivationScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a batched activation schedule and its current status. */
export class BatchedActivationSchedule {
  code: string;
  name: string;
  region: string;
  expiresAt: number;
  clicks: number;
  status: BatchedActivationScheduleStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    expiresAt: number,
    clicks: number,
    status: BatchedActivationScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
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

  canMoveTo(next: BatchedActivationScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BatchedActivationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched activation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.clicks * this.expiresAt * 100) / 100;
  }

  copy(): BatchedActivationSchedule {
    return new BatchedActivationSchedule(this.code, this.name, this.region, this.expiresAt, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched activation schedule in status proposed. */
export function newBatchedActivationSchedule(code: string, name: string): BatchedActivationSchedule {
  return new BatchedActivationSchedule(code, name, "", 0, 0, "proposed");
}
