import * as text from "../../../../kit/text.js";

/** Where a subscription exception is in its life cycle. */
export type SubscriptionExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a subscription exception and its current status. */
export class SubscriptionException {
  code: string;
  label: string;
  graceDays: number;
  category: string;
  reviewer: string;
  utmSource: string;
  segment: string;
  amount: number;
  externalRef: string;
  status: SubscriptionExceptionStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    category: string,
    reviewer: string,
    utmSource: string,
    segment: string,
    amount: number,
    externalRef: string,
    status: SubscriptionExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.category = category;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.segment = segment;
    this.amount = amount;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"subscription exception"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.amount + this.graceDays) * 100) / 100;
  }

  copy(): SubscriptionException {
    return new SubscriptionException(
      this.code,
      this.label,
      this.graceDays,
      this.category,
      this.reviewer,
      this.utmSource,
      this.segment,
      this.amount,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a subscription exception in status proposed. */
export function newSubscriptionException(code: string, label: string): SubscriptionException {
  return new SubscriptionException(code, label, 0, "", "", "", "", 0, "", "proposed");
}
