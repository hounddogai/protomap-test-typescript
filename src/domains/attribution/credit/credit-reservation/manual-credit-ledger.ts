import * as text from "../../../../kit/text.js";

/** Where a manual credit ledger is in its life cycle. */
export type ManualCreditLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One manual credit ledger, with what the planners need to act on it. */
export class ManualCreditLedger {
  code: string;
  label: string;
  weight: number;
  retries: number;
  version: number;
  priority: number;
  budget: number;
  variant: string;
  rate: number;
  status: ManualCreditLedgerStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    retries: number,
    version: number,
    priority: number,
    budget: number,
    variant: string,
    rate: number,
    status: ManualCreditLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.retries = retries;
    this.version = version;
    this.priority = priority;
    this.budget = budget;
    this.variant = variant;
    this.rate = rate;
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

  canMoveTo(next: ManualCreditLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
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

  moveTo(next: ManualCreditLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual credit ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.rate - this.budget) * 100) / 100;
  }

  copy(): ManualCreditLedger {
    return new ManualCreditLedger(
      this.code,
      this.label,
      this.weight,
      this.retries,
      this.version,
      this.priority,
      this.budget,
      this.variant,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual credit ledger in status planned. */
export function newManualCreditLedger(code: string, label: string): ManualCreditLedger {
  return new ManualCreditLedger(code, label, 0, 0, 0, 0, 0, "", 0, "planned");
}
