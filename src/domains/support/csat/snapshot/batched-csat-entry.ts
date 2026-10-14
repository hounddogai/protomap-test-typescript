import * as text from "../../../../kit/text.js";

/** Where a batched csat entry is in its life cycle. */
export type BatchedCsatEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched csat entry as the csat team keeps it. */
export class BatchedCsatEntry {
  code: string;
  title: string;
  description: string;
  attempts: number;
  maximum: number;
  status: BatchedCsatEntryStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    attempts: number,
    maximum: number,
    status: BatchedCsatEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.attempts = attempts;
    this.maximum = maximum;
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

  canMoveTo(next: BatchedCsatEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedCsatEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched csat entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched csat entry"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.maximum + this.attempts) * 100) / 100;
  }

  copy(): BatchedCsatEntry {
    return new BatchedCsatEntry(this.code, this.title, this.description, this.attempts, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched csat entry in status planned. */
export function newBatchedCsatEntry(code: string, title: string): BatchedCsatEntry {
  return new BatchedCsatEntry(code, title, "", 0, 0, "planned");
}
