/**
 * The rolling activation summary records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling activation summary is in its life cycle. */
export type RollingActivationSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One rolling activation summary, with what the planners need to act on it. */
export class RollingActivationSummary {
  code: string;
  name: string;
  externalRef: string;
  currency: string;
  clicks: number;
  cohort: string;
  status: RollingActivationSummaryStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    currency: string,
    clicks: number,
    cohort: string,
    status: RollingActivationSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.currency = currency;
    this.clicks = clicks;
    this.cohort = cohort;
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

  canMoveTo(next: RollingActivationSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingActivationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling activation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): RollingActivationSummary {
    return new RollingActivationSummary(
      this.code,
      this.name,
      this.externalRef,
      this.currency,
      this.clicks,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling activation summary in status new. */
export function newRollingActivationSummary(code: string, name: string): RollingActivationSummary {
  return new RollingActivationSummary(code, name, "", "", 0, "", "new");
}
