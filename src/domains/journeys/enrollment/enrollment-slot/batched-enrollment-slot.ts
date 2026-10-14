/**
 * The batched enrollment slot records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched enrollment slot is in its life cycle. */
export type BatchedEnrollmentSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched enrollment slot as the enrollment team keeps it. */
export class BatchedEnrollmentSlot {
  code: string;
  label: string;
  locale: string;
  amount: number;
  ceiling: number;
  visible: boolean;
  currency: string;
  summary: string;
  tags: string[];
  status: BatchedEnrollmentSlotStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    amount: number,
    ceiling: number,
    visible: boolean,
    currency: string,
    summary: string,
    tags: string[],
    status: BatchedEnrollmentSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.amount = amount;
    this.ceiling = ceiling;
    this.visible = visible;
    this.currency = currency;
    this.summary = summary;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedEnrollmentSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedEnrollmentSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched enrollment slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched enrollment slot"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.amount * this.ceiling * 100) / 100;
  }

  copy(): BatchedEnrollmentSlot {
    return new BatchedEnrollmentSlot(
      this.code,
      this.label,
      this.locale,
      this.amount,
      this.ceiling,
      this.visible,
      this.currency,
      this.summary,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched enrollment slot in status idle. */
export function newBatchedEnrollmentSlot(code: string, label: string): BatchedEnrollmentSlot {
  return new BatchedEnrollmentSlot(code, label, "", 0, 0, false, "", "", [], "idle");
}
