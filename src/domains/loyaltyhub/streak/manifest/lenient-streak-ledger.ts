import * as text from "../../../../kit/text.js";

/** Where a lenient streak ledger is in its life cycle. */
export type LenientStreakLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient streak ledger. Its code is unique within a tenant. */
export class LenientStreakLedger {
  code: string;
  title: string;
  clicks: number;
  locale: string;
  ownerId: string;
  checksum: string;
  description: string;
  status: LenientStreakLedgerStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    locale: string,
    ownerId: string,
    checksum: string,
    description: string,
    status: LenientStreakLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.locale = locale;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.description = description;
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

  canMoveTo(next: LenientStreakLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientStreakLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient streak ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): LenientStreakLedger {
    return new LenientStreakLedger(
      this.code,
      this.title,
      this.clicks,
      this.locale,
      this.ownerId,
      this.checksum,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient streak ledger in status planned. */
export function newLenientStreakLedger(code: string, title: string): LenientStreakLedger {
  return new LenientStreakLedger(code, title, 0, "", "", "", "", "planned");
}
