import * as text from "../../../../kit/text.js";

/** Where a pending fraud check snapshot is in its life cycle. */
export type PendingFraudCheckSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a pending fraud check snapshot and its current status. */
export class PendingFraudCheckSnapshot {
  code: string;
  label: string;
  discount: number;
  cohort: string;
  country: string;
  priority: number;
  status: PendingFraudCheckSnapshotStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    cohort: string,
    country: string,
    priority: number,
    status: PendingFraudCheckSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.cohort = cohort;
    this.country = country;
    this.priority = priority;
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

  canMoveTo(next: PendingFraudCheckSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
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

  moveTo(next: PendingFraudCheckSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending fraud check snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round(this.priority * this.discount * 100) / 100;
  }

  copy(): PendingFraudCheckSnapshot {
    return new PendingFraudCheckSnapshot(
      this.code,
      this.label,
      this.discount,
      this.cohort,
      this.country,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending fraud check snapshot in status proposed. */
export function newPendingFraudCheckSnapshot(code: string, label: string): PendingFraudCheckSnapshot {
  return new PendingFraudCheckSnapshot(code, label, 0, "", "", 0, "proposed");
}
