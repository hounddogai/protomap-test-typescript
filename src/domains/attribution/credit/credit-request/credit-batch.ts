import * as text from "../../../../kit/text.js";

/** Where a credit batch is in its life cycle. */
export type CreditBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A credit batch. Its code is unique within a tenant. */
export class CreditBatch {
  code: string;
  name: string;
  source: string;
  quantity: number;
  windowDays: number;
  notes: string;
  discount: number;
  clicks: number;
  status: CreditBatchStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    quantity: number,
    windowDays: number,
    notes: string,
    discount: number,
    clicks: number,
    status: CreditBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.notes = notes;
    this.discount = discount;
    this.clicks = clicks;
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

  canMoveTo(next: CreditBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CreditBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.windowDays - this.clicks) * 100) / 100;
  }

  copy(): CreditBatch {
    return new CreditBatch(
      this.code,
      this.name,
      this.source,
      this.quantity,
      this.windowDays,
      this.notes,
      this.discount,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a credit batch in status draft. */
export function newCreditBatch(code: string, name: string): CreditBatch {
  return new CreditBatch(code, name, "", 0, 0, "", 0, 0, "draft");
}
