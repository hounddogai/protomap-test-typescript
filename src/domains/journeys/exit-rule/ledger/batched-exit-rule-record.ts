import * as text from "../../../../kit/text.js";

/** Where a batched exit rule record is in its life cycle. */
export type BatchedExitRuleRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched exit rule record as the exit rule team keeps it. */
export class BatchedExitRuleRecord {
  code: string;
  label: string;
  durationMinutes: number;
  minimum: number;
  revision: number;
  floorValue: number;
  pinned: boolean;
  status: BatchedExitRuleRecordStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    minimum: number,
    revision: number,
    floorValue: number,
    pinned: boolean,
    status: BatchedExitRuleRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.revision = revision;
    this.floorValue = floorValue;
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

  canMoveTo(next: BatchedExitRuleRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
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
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedExitRuleRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched exit rule record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"batched exit rule record"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.minimum * this.durationMinutes * 100) / 100;
  }

  copy(): BatchedExitRuleRecord {
    return new BatchedExitRuleRecord(
      this.code,
      this.label,
      this.durationMinutes,
      this.minimum,
      this.revision,
      this.floorValue,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched exit rule record in status draft. */
export function newBatchedExitRuleRecord(code: string, label: string): BatchedExitRuleRecord {
  return new BatchedExitRuleRecord(code, label, 0, 0, 0, 0, false, "draft");
}
