/**
 * The global insight threshold records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global insight threshold is in its life cycle. */
export type GlobalInsightThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** A global insight threshold. Its code is unique within a tenant. */
export class GlobalInsightThreshold {
  code: string;
  title: string;
  retries: number;
  currency: string;
  discount: number;
  status: GlobalInsightThresholdStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    currency: string,
    discount: number,
    status: GlobalInsightThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.currency = currency;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalInsightThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalInsightThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global insight threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.retries - this.discount) * 100) / 100;
  }

  copy(): GlobalInsightThreshold {
    return new GlobalInsightThreshold(this.code, this.title, this.retries, this.currency, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global insight threshold in status requested. */
export function newGlobalInsightThreshold(code: string, title: string): GlobalInsightThreshold {
  return new GlobalInsightThreshold(code, title, 0, "", 0, "requested");
}
