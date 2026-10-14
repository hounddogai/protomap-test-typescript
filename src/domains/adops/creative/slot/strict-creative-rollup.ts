import * as text from "../../../../kit/text.js";

/** Where a strict creative rollup is in its life cycle. */
export type StrictCreativeRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a strict creative rollup and its current status. */
export class StrictCreativeRollup {
  code: string;
  label: string;
  quantity: number;
  checksum: string;
  batchSize: number;
  pinned: boolean;
  status: StrictCreativeRollupStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    checksum: string,
    batchSize: number,
    pinned: boolean,
    status: StrictCreativeRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.pinned = pinned;
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

  canMoveTo(next: StrictCreativeRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictCreativeRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict creative rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round(this.quantity * this.batchSize * 100) / 100;
  }

  copy(): StrictCreativeRollup {
    return new StrictCreativeRollup(
      this.code,
      this.label,
      this.quantity,
      this.checksum,
      this.batchSize,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict creative rollup in status planned. */
export function newStrictCreativeRollup(code: string, label: string): StrictCreativeRollup {
  return new StrictCreativeRollup(code, label, 0, "", 0, false, "planned");
}
