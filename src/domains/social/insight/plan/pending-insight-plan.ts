import * as text from "../../../../kit/text.js";

/** Where a pending insight plan is in its life cycle. */
export type PendingInsightPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending insight plan as the insight team keeps it. */
export class PendingInsightPlan {
  code: string;
  name: string;
  threshold: number;
  sequence: number;
  checksum: string;
  status: PendingInsightPlanStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    sequence: number,
    checksum: string,
    status: PendingInsightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.sequence = sequence;
    this.checksum = checksum;
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

  canMoveTo(next: PendingInsightPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingInsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.threshold - this.sequence) * 100) / 100;
  }

  copy(): PendingInsightPlan {
    return new PendingInsightPlan(this.code, this.name, this.threshold, this.sequence, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending insight plan in status proposed. */
export function newPendingInsightPlan(code: string, name: string): PendingInsightPlan {
  return new PendingInsightPlan(code, name, 0, 0, "", "proposed");
}
