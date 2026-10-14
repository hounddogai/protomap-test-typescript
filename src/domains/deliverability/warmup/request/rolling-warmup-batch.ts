import * as text from "../../../../kit/text.js";

/** Where a rolling warmup batch is in its life cycle. */
export type RollingWarmupBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling warmup batch as the warmup team keeps it. */
export class RollingWarmupBatch {
  code: string;
  label: string;
  frequencyCap: number;
  sendAt: number;
  amount: number;
  expiresAt: number;
  budget: number;
  unit: string;
  updatedAt: number;
  startsAt: number;
  status: RollingWarmupBatchStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    sendAt: number,
    amount: number,
    expiresAt: number,
    budget: number,
    unit: string,
    updatedAt: number,
    startsAt: number,
    status: RollingWarmupBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.amount = amount;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.unit = unit;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingWarmupBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingWarmupBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling warmup batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"rolling warmup batch"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.updatedAt - this.budget) * 100) / 100;
  }

  copy(): RollingWarmupBatch {
    return new RollingWarmupBatch(
      this.code,
      this.label,
      this.frequencyCap,
      this.sendAt,
      this.amount,
      this.expiresAt,
      this.budget,
      this.unit,
      this.updatedAt,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling warmup batch in status new. */
export function newRollingWarmupBatch(code: string, label: string): RollingWarmupBatch {
  return new RollingWarmupBatch(code, label, 0, 0, 0, 0, 0, "", 0, 0, "new");
}
