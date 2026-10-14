import * as text from "../../../../kit/text.js";

/** Where a manual subscription baseline is in its life cycle. */
export type ManualSubscriptionBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual subscription baseline. Its code is unique within a tenant. */
export class ManualSubscriptionBaseline {
  code: string;
  name: string;
  currency: string;
  pinned: boolean;
  campaignRef: string;
  amount: number;
  status: ManualSubscriptionBaselineStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    pinned: boolean,
    campaignRef: string,
    amount: number,
    status: ManualSubscriptionBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.pinned = pinned;
    this.campaignRef = campaignRef;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualSubscriptionBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualSubscriptionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual subscription baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual subscription baseline"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ManualSubscriptionBaseline {
    return new ManualSubscriptionBaseline(
      this.code,
      this.name,
      this.currency,
      this.pinned,
      this.campaignRef,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual subscription baseline in status open. */
export function newManualSubscriptionBaseline(code: string, name: string): ManualSubscriptionBaseline {
  return new ManualSubscriptionBaseline(code, name, "", false, "", 0, "open");
}
