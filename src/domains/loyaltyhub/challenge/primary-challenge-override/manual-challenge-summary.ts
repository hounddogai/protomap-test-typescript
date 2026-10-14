import * as text from "../../../../kit/text.js";

/** Where a manual challenge summary is in its life cycle. */
export type ManualChallengeSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a manual challenge summary and its current status. */
export class ManualChallengeSummary {
  code: string;
  name: string;
  budget: number;
  amount: number;
  durationMinutes: number;
  cohort: string;
  threshold: number;
  limit: number;
  currency: string;
  retries: number;
  active: boolean;
  status: ManualChallengeSummaryStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    amount: number,
    durationMinutes: number,
    cohort: string,
    threshold: number,
    limit: number,
    currency: string,
    retries: number,
    active: boolean,
    status: ManualChallengeSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
    this.cohort = cohort;
    this.threshold = threshold;
    this.limit = limit;
    this.currency = currency;
    this.retries = retries;
    this.active = active;
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

  canMoveTo(next: ManualChallengeSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualChallengeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual challenge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.retries + this.threshold) * 100) / 100;
  }

  copy(): ManualChallengeSummary {
    return new ManualChallengeSummary(
      this.code,
      this.name,
      this.budget,
      this.amount,
      this.durationMinutes,
      this.cohort,
      this.threshold,
      this.limit,
      this.currency,
      this.retries,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual challenge summary in status idle. */
export function newManualChallengeSummary(code: string, name: string): ManualChallengeSummary {
  return new ManualChallengeSummary(code, name, 0, 0, 0, "", 0, 0, "", 0, false, "idle");
}
