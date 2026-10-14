/**
 * The deflection summary records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection summary is in its life cycle. */
export type DeflectionSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A deflection summary. Its code is unique within a tenant. */
export class DeflectionSummary {
  code: string;
  label: string;
  cohort: string;
  currency: string;
  quantity: number;
  externalRef: string;
  batchSize: number;
  status: DeflectionSummaryStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    currency: string,
    quantity: number,
    externalRef: string,
    batchSize: number,
    status: DeflectionSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.currency = currency;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
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

  canMoveTo(next: DeflectionSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DeflectionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"deflection summary"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.batchSize - this.quantity) * 100) / 100;
  }

  copy(): DeflectionSummary {
    return new DeflectionSummary(
      this.code,
      this.label,
      this.cohort,
      this.currency,
      this.quantity,
      this.externalRef,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a deflection summary in status draft. */
export function newDeflectionSummary(code: string, label: string): DeflectionSummary {
  return new DeflectionSummary(code, label, "", "", 0, "", 0, "draft");
}
