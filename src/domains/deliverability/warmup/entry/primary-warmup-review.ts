import * as text from "../../../../kit/text.js";

/** Where a primary warmup review is in its life cycle. */
export type PrimaryWarmupReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary warmup review as the warmup team keeps it. */
export class PrimaryWarmupReview {
  code: string;
  title: string;
  summary: string;
  priority: number;
  pinned: boolean;
  unit: string;
  checksum: string;
  status: PrimaryWarmupReviewStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    priority: number,
    pinned: boolean,
    unit: string,
    checksum: string,
    status: PrimaryWarmupReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.priority = priority;
    this.pinned = pinned;
    this.unit = unit;
    this.checksum = checksum;
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

  canMoveTo(next: PrimaryWarmupReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryWarmupReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary warmup review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): PrimaryWarmupReview {
    return new PrimaryWarmupReview(
      this.code,
      this.title,
      this.summary,
      this.priority,
      this.pinned,
      this.unit,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary warmup review in status planned. */
export function newPrimaryWarmupReview(code: string, title: string): PrimaryWarmupReview {
  return new PrimaryWarmupReview(code, title, "", 0, false, "", "", "planned");
}
