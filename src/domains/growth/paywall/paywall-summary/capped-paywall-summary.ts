/**
 * The capped paywall summary records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped paywall summary is in its life cycle. */
export type CappedPaywallSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a capped paywall summary and its current status. */
export class CappedPaywallSummary {
  code: string;
  name: string;
  maximum: number;
  quantity: number;
  externalRef: string;
  limit: number;
  status: CappedPaywallSummaryStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    quantity: number,
    externalRef: string,
    limit: number,
    status: CappedPaywallSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.limit = limit;
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

  canMoveTo(next: CappedPaywallSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedPaywallSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped paywall summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedValue(): number {
    return Math.round((this.maximum + this.quantity) * 100) / 100;
  }

  copy(): CappedPaywallSummary {
    return new CappedPaywallSummary(
      this.code,
      this.name,
      this.maximum,
      this.quantity,
      this.externalRef,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped paywall summary in status new. */
export function newCappedPaywallSummary(code: string, name: string): CappedPaywallSummary {
  return new CappedPaywallSummary(code, name, 0, 0, "", 0, "new");
}
