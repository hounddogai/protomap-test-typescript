import * as text from "../../../../kit/text.js";

/** Where a fallback double opt in batch is in its life cycle. */
export type FallbackDoubleOptInBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback double opt in batch. Its code is unique within a tenant. */
export class FallbackDoubleOptInBatch {
  code: string;
  title: string;
  priority: number;
  windowDays: number;
  cost: number;
  phone: string;
  conversionRate: number;
  reviewer: string;
  source: string;
  endsAt: number;
  status: FallbackDoubleOptInBatchStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    windowDays: number,
    cost: number,
    phone: string,
    conversionRate: number,
    reviewer: string,
    source: string,
    endsAt: number,
    status: FallbackDoubleOptInBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.windowDays = windowDays;
    this.cost = cost;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.reviewer = reviewer;
    this.source = source;
    this.endsAt = endsAt;
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

  canMoveTo(next: FallbackDoubleOptInBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: FallbackDoubleOptInBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback double opt in batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback double opt in batch"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.endsAt + this.priority) * 100) / 100;
  }

  copy(): FallbackDoubleOptInBatch {
    return new FallbackDoubleOptInBatch(
      this.code,
      this.title,
      this.priority,
      this.windowDays,
      this.cost,
      this.phone,
      this.conversionRate,
      this.reviewer,
      this.source,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback double opt in batch in status planned. */
export function newFallbackDoubleOptInBatch(code: string, title: string): FallbackDoubleOptInBatch {
  return new FallbackDoubleOptInBatch(code, title, 0, 0, 0, "", 0, "", "", 0, "planned");
}
