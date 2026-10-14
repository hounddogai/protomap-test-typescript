/**
 * The bounce summary records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce summary is in its life cycle. */
export type BounceSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A bounce summary as the bounce team keeps it. */
export class BounceSummary {
  code: string;
  label: string;
  amount: number;
  audienceId: string;
  cost: number;
  currency: string;
  region: string;
  status: BounceSummaryStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    audienceId: string,
    cost: number,
    currency: string,
    region: string,
    status: BounceSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.audienceId = audienceId;
    this.cost = cost;
    this.currency = currency;
    this.region = region;
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

  canMoveTo(next: BounceSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BounceSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round((this.amount - this.cost) * 100) / 100;
  }

  copy(): BounceSummary {
    return new BounceSummary(
      this.code,
      this.label,
      this.amount,
      this.audienceId,
      this.cost,
      this.currency,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a bounce summary in status idle. */
export function newBounceSummary(code: string, label: string): BounceSummary {
  return new BounceSummary(code, label, 0, "", 0, "", "", "idle");
}
