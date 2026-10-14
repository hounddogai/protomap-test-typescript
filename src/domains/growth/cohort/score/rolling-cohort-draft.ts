import * as text from "../../../../kit/text.js";

/** Where a rolling cohort draft is in its life cycle. */
export type RollingCohortDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling cohort draft as the cohort team keeps it. */
export class RollingCohortDraft {
  code: string;
  name: string;
  threshold: number;
  locale: string;
  budget: number;
  discount: number;
  attempts: number;
  windowDays: number;
  status: RollingCohortDraftStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    locale: string,
    budget: number,
    discount: number,
    attempts: number,
    windowDays: number,
    status: RollingCohortDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.locale = locale;
    this.budget = budget;
    this.discount = discount;
    this.attempts = attempts;
    this.windowDays = windowDays;
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

  canMoveTo(next: RollingCohortDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingCohortDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling cohort draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling cohort draft"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.windowDays + this.discount) * 100) / 100;
  }

  copy(): RollingCohortDraft {
    return new RollingCohortDraft(
      this.code,
      this.name,
      this.threshold,
      this.locale,
      this.budget,
      this.discount,
      this.attempts,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling cohort draft in status idle. */
export function newRollingCohortDraft(code: string, name: string): RollingCohortDraft {
  return new RollingCohortDraft(code, name, 0, "", 0, 0, 0, 0, "idle");
}
