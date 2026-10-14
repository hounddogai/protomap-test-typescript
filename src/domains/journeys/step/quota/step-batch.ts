import * as text from "../../../../kit/text.js";

/** Where a step batch is in its life cycle. */
export type StepBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A step batch. Its code is unique within a tenant. */
export class StepBatch {
  code: string;
  name: string;
  updatedAt: number;
  score: number;
  priority: number;
  country: string;
  capacity: number;
  status: StepBatchStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    score: number,
    priority: number,
    country: string,
    capacity: number,
    status: StepBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.score = score;
    this.priority = priority;
    this.country = country;
    this.capacity = capacity;
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

  canMoveTo(next: StepBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StepBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round((this.priority - this.updatedAt) * 100) / 100;
  }

  copy(): StepBatch {
    return new StepBatch(
      this.code,
      this.name,
      this.updatedAt,
      this.score,
      this.priority,
      this.country,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a step batch in status draft. */
export function newStepBatch(code: string, name: string): StepBatch {
  return new StepBatch(code, name, 0, 0, 0, "", 0, "draft");
}
