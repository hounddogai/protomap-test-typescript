import * as text from "../../../../kit/text.js";

/** Where a global conversion budget is in its life cycle. */
export type GlobalConversionBudgetStatus = "created" | "validated" | "published" | "retired";

/** A global conversion budget as the conversion team keeps it. */
export class GlobalConversionBudget {
  code: string;
  label: string;
  currency: string;
  sendAt: number;
  capacity: number;
  pinned: boolean;
  checksum: string;
  status: GlobalConversionBudgetStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    sendAt: number,
    capacity: number,
    pinned: boolean,
    checksum: string,
    status: GlobalConversionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.sendAt = sendAt;
    this.capacity = capacity;
    this.pinned = pinned;
    this.checksum = checksum;
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

  canMoveTo(next: GlobalConversionBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalConversionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global conversion budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.sendAt * this.capacity * 100) / 100;
  }

  copy(): GlobalConversionBudget {
    return new GlobalConversionBudget(
      this.code,
      this.label,
      this.currency,
      this.sendAt,
      this.capacity,
      this.pinned,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global conversion budget in status created. */
export function newGlobalConversionBudget(code: string, label: string): GlobalConversionBudget {
  return new GlobalConversionBudget(code, label, "", 0, 0, false, "", "created");
}
