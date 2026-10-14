import * as text from "../../../../kit/text.js";

/** Where a batched nudge variance is in its life cycle. */
export type BatchedNudgeVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched nudge variance. Its code is unique within a tenant. */
export class BatchedNudgeVariance {
  code: string;
  label: string;
  budget: number;
  capacity: number;
  batchSize: number;
  priority: number;
  timezone: string;
  minimum: number;
  category: string;
  contactEmail: string;
  status: BatchedNudgeVarianceStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    capacity: number,
    batchSize: number,
    priority: number,
    timezone: string,
    minimum: number,
    category: string,
    contactEmail: string,
    status: BatchedNudgeVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.priority = priority;
    this.timezone = timezone;
    this.minimum = minimum;
    this.category = category;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: BatchedNudgeVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedNudgeVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched nudge variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.priority + this.batchSize) * 100) / 100;
  }

  copy(): BatchedNudgeVariance {
    return new BatchedNudgeVariance(
      this.code,
      this.label,
      this.budget,
      this.capacity,
      this.batchSize,
      this.priority,
      this.timezone,
      this.minimum,
      this.category,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched nudge variance in status planned. */
export function newBatchedNudgeVariance(code: string, label: string): BatchedNudgeVariance {
  return new BatchedNudgeVariance(code, label, 0, 0, 0, 0, "", 0, "", "", "planned");
}
