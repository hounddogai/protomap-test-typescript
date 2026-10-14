import * as text from "../../../../kit/text.js";

/** Where a credit entry is in its life cycle. */
export type CreditEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a credit entry and its current status. */
export class CreditEntry {
  code: string;
  label: string;
  conversionRate: number;
  ownerId: string;
  attempts: number;
  status: CreditEntryStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    ownerId: string,
    attempts: number,
    status: CreditEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.ownerId = ownerId;
    this.attempts = attempts;
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

  canMoveTo(next: CreditEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CreditEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"credit entry"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.conversionRate * this.attempts * 100) / 100;
  }

  copy(): CreditEntry {
    return new CreditEntry(this.code, this.label, this.conversionRate, this.ownerId, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a credit entry in status draft. */
export function newCreditEntry(code: string, label: string): CreditEntry {
  return new CreditEntry(code, label, 0, "", 0, "draft");
}
