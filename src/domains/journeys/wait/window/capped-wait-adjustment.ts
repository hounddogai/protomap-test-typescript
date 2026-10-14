import * as text from "../../../../kit/text.js";

/** Where a capped wait adjustment is in its life cycle. */
export type CappedWaitAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a capped wait adjustment and its current status. */
export class CappedWaitAdjustment {
  code: string;
  title: string;
  description: string;
  graceDays: number;
  attempts: number;
  contactEmail: string;
  expiresAt: number;
  category: string;
  status: CappedWaitAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    graceDays: number,
    attempts: number,
    contactEmail: string,
    expiresAt: number,
    category: string,
    status: CappedWaitAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.graceDays = graceDays;
    this.attempts = attempts;
    this.contactEmail = contactEmail;
    this.expiresAt = expiresAt;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedWaitAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedWaitAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped wait adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round((this.graceDays - this.expiresAt) * 100) / 100;
  }

  copy(): CappedWaitAdjustment {
    return new CappedWaitAdjustment(
      this.code,
      this.title,
      this.description,
      this.graceDays,
      this.attempts,
      this.contactEmail,
      this.expiresAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped wait adjustment in status proposed. */
export function newCappedWaitAdjustment(code: string, title: string): CappedWaitAdjustment {
  return new CappedWaitAdjustment(code, title, "", 0, 0, "", 0, "", "proposed");
}
