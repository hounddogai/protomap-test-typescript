import * as text from "../../../../kit/text.js";

/** Where a tiered branch adjustment is in its life cycle. */
export type TieredBranchAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a tiered branch adjustment and its current status. */
export class TieredBranchAdjustment {
  code: string;
  label: string;
  updatedAt: number;
  sequence: number;
  priority: number;
  durationMinutes: number;
  minimum: number;
  status: TieredBranchAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    sequence: number,
    priority: number,
    durationMinutes: number,
    minimum: number,
    status: TieredBranchAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredBranchAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredBranchAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered branch adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.priority - this.sequence) * 100) / 100;
  }

  copy(): TieredBranchAdjustment {
    return new TieredBranchAdjustment(
      this.code,
      this.label,
      this.updatedAt,
      this.sequence,
      this.priority,
      this.durationMinutes,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered branch adjustment in status planned. */
export function newTieredBranchAdjustment(code: string, label: string): TieredBranchAdjustment {
  return new TieredBranchAdjustment(code, label, 0, 0, 0, 0, 0, "planned");
}
