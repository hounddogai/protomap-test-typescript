import * as text from "../../../../kit/text.js";

/** Where a credit record is in its life cycle. */
export type CreditRecordStatus = "created" | "validated" | "published" | "retired";

/** One credit record, with what the planners need to act on it. */
export class CreditRecord {
  code: string;
  label: string;
  category: string;
  journeyId: string;
  ceiling: number;
  quantity: number;
  conversionRate: number;
  summary: string;
  status: CreditRecordStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    journeyId: string,
    ceiling: number,
    quantity: number,
    conversionRate: number,
    summary: string,
    status: CreditRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.summary = summary;
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

  canMoveTo(next: CreditRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: CreditRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"credit record"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.conversionRate - this.ceiling) * 100) / 100;
  }

  copy(): CreditRecord {
    return new CreditRecord(
      this.code,
      this.label,
      this.category,
      this.journeyId,
      this.ceiling,
      this.quantity,
      this.conversionRate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a credit record in status created. */
export function newCreditRecord(code: string, label: string): CreditRecord {
  return new CreditRecord(code, label, "", "", 0, 0, 0, "", "created");
}
