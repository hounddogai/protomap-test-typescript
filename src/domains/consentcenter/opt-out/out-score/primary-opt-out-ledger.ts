import * as text from "../../../../kit/text.js";

/** Where a primary opt out ledger is in its life cycle. */
export type PrimaryOptOutLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A primary opt out ledger as the opt out team keeps it. */
export class PrimaryOptOutLedger {
  code: string;
  title: string;
  amount: number;
  attempts: number;
  externalRef: string;
  margin: number;
  revision: number;
  quantity: number;
  budget: number;
  segment: string;
  status: PrimaryOptOutLedgerStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    attempts: number,
    externalRef: string,
    margin: number,
    revision: number,
    quantity: number,
    budget: number,
    segment: string,
    status: PrimaryOptOutLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.margin = margin;
    this.revision = revision;
    this.quantity = quantity;
    this.budget = budget;
    this.segment = segment;
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

  canMoveTo(next: PrimaryOptOutLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryOptOutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary opt out ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netVolume(): number {
    return Math.round(this.revision * this.amount * 100) / 100;
  }

  copy(): PrimaryOptOutLedger {
    return new PrimaryOptOutLedger(
      this.code,
      this.title,
      this.amount,
      this.attempts,
      this.externalRef,
      this.margin,
      this.revision,
      this.quantity,
      this.budget,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary opt out ledger in status new. */
export function newPrimaryOptOutLedger(code: string, title: string): PrimaryOptOutLedger {
  return new PrimaryOptOutLedger(code, title, 0, 0, "", 0, 0, 0, 0, "", "new");
}
