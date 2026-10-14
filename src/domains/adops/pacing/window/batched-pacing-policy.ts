import * as text from "../../../../kit/text.js";

/** Where a batched pacing policy is in its life cycle. */
export type BatchedPacingPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One batched pacing policy, with what the planners need to act on it. */
export class BatchedPacingPolicy {
  code: string;
  label: string;
  unit: string;
  graceDays: number;
  retries: number;
  status: BatchedPacingPolicyStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    graceDays: number,
    retries: number,
    status: BatchedPacingPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.graceDays = graceDays;
    this.retries = retries;
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

  canMoveTo(next: BatchedPacingPolicyStatus): boolean {
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
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BatchedPacingPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched pacing policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched pacing policy"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.retries * this.graceDays * 100) / 100;
  }

  copy(): BatchedPacingPolicy {
    return new BatchedPacingPolicy(this.code, this.label, this.unit, this.graceDays, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched pacing policy in status proposed. */
export function newBatchedPacingPolicy(code: string, label: string): BatchedPacingPolicy {
  return new BatchedPacingPolicy(code, label, "", 0, 0, "proposed");
}
