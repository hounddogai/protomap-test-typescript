/**
 * The credit metric records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit metric is in its life cycle. */
export type CreditMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** One credit metric, with what the planners need to act on it. */
export class CreditMetric {
  code: string;
  label: string;
  sendAt: number;
  phone: string;
  country: string;
  externalRef: string;
  locale: string;
  status: CreditMetricStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    phone: string,
    country: string,
    externalRef: string,
    locale: string,
    status: CreditMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.phone = phone;
    this.country = country;
    this.externalRef = externalRef;
    this.locale = locale;
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

  canMoveTo(next: CreditMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
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
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CreditMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): CreditMetric {
    return new CreditMetric(
      this.code,
      this.label,
      this.sendAt,
      this.phone,
      this.country,
      this.externalRef,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a credit metric in status new. */
export function newCreditMetric(code: string, label: string): CreditMetric {
  return new CreditMetric(code, label, 0, "", "", "", "", "new");
}
