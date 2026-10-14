import * as text from "../../../../kit/text.js";

/** Where a capped sla ledger is in its life cycle. */
export type CappedSlaLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped sla ledger as the sla team keeps it. */
export class CappedSlaLedger {
  code: string;
  label: string;
  locale: string;
  updatedAt: number;
  reviewer: string;
  floorValue: number;
  ownerId: string;
  source: string;
  margin: number;
  status: CappedSlaLedgerStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    updatedAt: number,
    reviewer: string,
    floorValue: number,
    ownerId: string,
    source: string,
    margin: number,
    status: CappedSlaLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.source = source;
    this.margin = margin;
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

  canMoveTo(next: CappedSlaLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedSlaLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sla ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round((this.floorValue - this.margin) * 100) / 100;
  }

  copy(): CappedSlaLedger {
    return new CappedSlaLedger(
      this.code,
      this.label,
      this.locale,
      this.updatedAt,
      this.reviewer,
      this.floorValue,
      this.ownerId,
      this.source,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped sla ledger in status planned. */
export function newCappedSlaLedger(code: string, label: string): CappedSlaLedger {
  return new CappedSlaLedger(code, label, "", 0, "", 0, "", "", 0, "planned");
}
