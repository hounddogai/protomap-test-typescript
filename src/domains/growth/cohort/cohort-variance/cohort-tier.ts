import * as text from "../../../../kit/text.js";

/** Where a cohort tier is in its life cycle. */
export type CohortTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One cohort tier, with what the planners need to act on it. */
export class CohortTier {
  code: string;
  label: string;
  quantity: number;
  rate: number;
  windowDays: number;
  channel: string;
  retries: number;
  attempts: number;
  status: CohortTierStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    rate: number,
    windowDays: number,
    channel: string,
    retries: number,
    attempts: number,
    status: CohortTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.rate = rate;
    this.windowDays = windowDays;
    this.channel = channel;
    this.retries = retries;
    this.attempts = attempts;
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

  canMoveTo(next: CohortTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CohortTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round((this.retries + this.windowDays) * 100) / 100;
  }

  copy(): CohortTier {
    return new CohortTier(
      this.code,
      this.label,
      this.quantity,
      this.rate,
      this.windowDays,
      this.channel,
      this.retries,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a cohort tier in status open. */
export function newCohortTier(code: string, label: string): CohortTier {
  return new CohortTier(code, label, 0, 0, 0, "", 0, 0, "open");
}
