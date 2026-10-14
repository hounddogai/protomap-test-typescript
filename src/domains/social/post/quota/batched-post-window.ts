import * as text from "../../../../kit/text.js";

/** Where a batched post window is in its life cycle. */
export type BatchedPostWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched post window. Its code is unique within a tenant. */
export class BatchedPostWindow {
  code: string;
  label: string;
  sequence: number;
  capacity: number;
  locale: string;
  minimum: number;
  status: BatchedPostWindowStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    capacity: number,
    locale: string,
    minimum: number,
    status: BatchedPostWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.capacity = capacity;
    this.locale = locale;
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

  canMoveTo(next: BatchedPostWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPostWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched post window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched post window"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.minimum - this.capacity) * 100) / 100;
  }

  copy(): BatchedPostWindow {
    return new BatchedPostWindow(
      this.code,
      this.label,
      this.sequence,
      this.capacity,
      this.locale,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched post window in status planned. */
export function newBatchedPostWindow(code: string, label: string): BatchedPostWindow {
  return new BatchedPostWindow(code, label, 0, 0, "", 0, "planned");
}
