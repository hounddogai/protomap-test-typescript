import * as text from "../../../../kit/text.js";

/** Where a batched credit override is in its life cycle. */
export type BatchedCreditOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched credit override, with what the planners need to act on it. */
export class BatchedCreditOverride {
  code: string;
  label: string;
  segment: string;
  utmSource: string;
  currency: string;
  graceDays: number;
  source: string;
  phone: string;
  status: BatchedCreditOverrideStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    utmSource: string,
    currency: string,
    graceDays: number,
    source: string,
    phone: string,
    status: BatchedCreditOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.utmSource = utmSource;
    this.currency = currency;
    this.graceDays = graceDays;
    this.source = source;
    this.phone = phone;
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

  canMoveTo(next: BatchedCreditOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedCreditOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched credit override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched credit override"} ${this.code}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): BatchedCreditOverride {
    return new BatchedCreditOverride(
      this.code,
      this.label,
      this.segment,
      this.utmSource,
      this.currency,
      this.graceDays,
      this.source,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched credit override in status draft. */
export function newBatchedCreditOverride(code: string, label: string): BatchedCreditOverride {
  return new BatchedCreditOverride(code, label, "", "", "", 0, "", "", "draft");
}
