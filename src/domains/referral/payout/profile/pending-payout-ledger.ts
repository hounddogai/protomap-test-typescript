import * as text from "../../../../kit/text.js";

/** Where a pending payout ledger is in its life cycle. */
export type PendingPayoutLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending payout ledger. Its code is unique within a tenant. */
export class PendingPayoutLedger {
  code: string;
  label: string;
  attempts: number;
  threshold: number;
  attributes: Map<string, string>;
  status: PendingPayoutLedgerStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    threshold: number,
    attributes: Map<string, string>,
    status: PendingPayoutLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.threshold = threshold;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingPayoutLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingPayoutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending payout ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round(this.threshold * this.attempts * 100) / 100;
  }

  copy(): PendingPayoutLedger {
    return new PendingPayoutLedger(this.code, this.label, this.attempts, this.threshold, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending payout ledger in status new. */
export function newPendingPayoutLedger(code: string, label: string): PendingPayoutLedger {
  return new PendingPayoutLedger(code, label, 0, 0, new Map<string, string>(), "new");
}
