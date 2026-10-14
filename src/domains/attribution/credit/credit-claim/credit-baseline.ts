import * as text from "../../../../kit/text.js";

/** Where a credit baseline is in its life cycle. */
export type CreditBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One credit baseline, with what the planners need to act on it. */
export class CreditBaseline {
  code: string;
  label: string;
  createdAt: number;
  discount: number;
  retries: number;
  unit: string;
  impressions: number;
  checksum: string;
  status: CreditBaselineStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    discount: number,
    retries: number,
    unit: string,
    impressions: number,
    checksum: string,
    status: CreditBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.discount = discount;
    this.retries = retries;
    this.unit = unit;
    this.impressions = impressions;
    this.checksum = checksum;
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

  canMoveTo(next: CreditBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"credit baseline"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.createdAt * this.impressions * 100) / 100;
  }

  copy(): CreditBaseline {
    return new CreditBaseline(
      this.code,
      this.label,
      this.createdAt,
      this.discount,
      this.retries,
      this.unit,
      this.impressions,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a credit baseline in status new. */
export function newCreditBaseline(code: string, label: string): CreditBaseline {
  return new CreditBaseline(code, label, 0, 0, 0, "", 0, "", "new");
}
