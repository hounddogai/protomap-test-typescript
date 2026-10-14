import * as text from "../../../../kit/text.js";

/** Where a tier ledger is in its life cycle. */
export type TierLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a tier ledger and its current status. */
export class TierLedger {
  code: string;
  title: string;
  locale: string;
  impressions: number;
  frequencyCap: number;
  unit: string;
  status: TierLedgerStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    impressions: number,
    frequencyCap: number,
    unit: string,
    status: TierLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.unit = unit;
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

  canMoveTo(next: TierLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.frequencyCap - this.impressions) * 100) / 100;
  }

  copy(): TierLedger {
    return new TierLedger(
      this.code,
      this.title,
      this.locale,
      this.impressions,
      this.frequencyCap,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier ledger in status draft. */
export function newTierLedger(code: string, title: string): TierLedger {
  return new TierLedger(code, title, "", 0, 0, "", "draft");
}
