import * as text from "../../../../kit/text.js";

/** Where a pending subscription threshold is in its life cycle. */
export type PendingSubscriptionThresholdStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending subscription threshold and its current status. */
export class PendingSubscriptionThreshold {
  code: string;
  title: string;
  graceDays: number;
  reviewer: string;
  notes: string;
  status: PendingSubscriptionThresholdStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    reviewer: string,
    notes: string,
    status: PendingSubscriptionThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingSubscriptionThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingSubscriptionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending subscription threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): PendingSubscriptionThreshold {
    return new PendingSubscriptionThreshold(
      this.code,
      this.title,
      this.graceDays,
      this.reviewer,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending subscription threshold in status created. */
export function newPendingSubscriptionThreshold(code: string, title: string): PendingSubscriptionThreshold {
  return new PendingSubscriptionThreshold(code, title, 0, "", "", "created");
}
