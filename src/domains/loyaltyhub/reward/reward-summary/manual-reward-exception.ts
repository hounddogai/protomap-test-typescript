import * as text from "../../../../kit/text.js";

/** Where a manual reward exception is in its life cycle. */
export type ManualRewardExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual reward exception. Its code is unique within a tenant. */
export class ManualRewardException {
  code: string;
  name: string;
  country: string;
  externalRef: string;
  amount: number;
  status: ManualRewardExceptionStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    externalRef: string,
    amount: number,
    status: ManualRewardExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.externalRef = externalRef;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualRewardExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRewardExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual reward exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ManualRewardException {
    return new ManualRewardException(this.code, this.name, this.country, this.externalRef, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual reward exception in status idle. */
export function newManualRewardException(code: string, name: string): ManualRewardException {
  return new ManualRewardException(code, name, "", "", 0, "idle");
}
