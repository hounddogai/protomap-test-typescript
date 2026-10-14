/**
 * The batched domain segment records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched domain segment is in its life cycle. */
export type BatchedDomainSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched domain segment as the domain team keeps it. */
export class BatchedDomainSegment {
  code: string;
  label: string;
  endsAt: number;
  phone: string;
  frequencyCap: number;
  priority: number;
  windowDays: number;
  locale: string;
  status: BatchedDomainSegmentStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    phone: string,
    frequencyCap: number,
    priority: number,
    windowDays: number,
    locale: string,
    status: BatchedDomainSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.phone = phone;
    this.frequencyCap = frequencyCap;
    this.priority = priority;
    this.windowDays = windowDays;
    this.locale = locale;
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

  canMoveTo(next: BatchedDomainSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
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

  moveTo(next: BatchedDomainSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched domain segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched domain segment"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.endsAt * this.frequencyCap * 100) / 100;
  }

  copy(): BatchedDomainSegment {
    return new BatchedDomainSegment(
      this.code,
      this.label,
      this.endsAt,
      this.phone,
      this.frequencyCap,
      this.priority,
      this.windowDays,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched domain segment in status planned. */
export function newBatchedDomainSegment(code: string, label: string): BatchedDomainSegment {
  return new BatchedDomainSegment(code, label, 0, "", 0, 0, 0, "", "planned");
}
