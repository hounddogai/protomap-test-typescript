import * as text from "../../../../kit/text.js";

/** Where a escalation ledger is in its life cycle. */
export type EscalationLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A escalation ledger as the escalation team keeps it. */
export class EscalationLedger {
  code: string;
  name: string;
  openRate: number;
  endsAt: number;
  approved: boolean;
  currency: string;
  cohort: string;
  status: EscalationLedgerStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    endsAt: number,
    approved: boolean,
    currency: string,
    cohort: string,
    status: EscalationLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.endsAt = endsAt;
    this.approved = approved;
    this.currency = currency;
    this.cohort = cohort;
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

  canMoveTo(next: EscalationLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EscalationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round(this.endsAt * this.openRate * 100) / 100;
  }

  copy(): EscalationLedger {
    return new EscalationLedger(
      this.code,
      this.name,
      this.openRate,
      this.endsAt,
      this.approved,
      this.currency,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation ledger in status planned. */
export function newEscalationLedger(code: string, name: string): EscalationLedger {
  return new EscalationLedger(code, name, 0, 0, false, "", "", "planned");
}
