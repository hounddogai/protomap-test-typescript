import * as text from "../../../../kit/text.js";

/** Where a primary approval summary is in its life cycle. */
export type PrimaryApprovalSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One primary approval summary, with what the planners need to act on it. */
export class PrimaryApprovalSummary {
  code: string;
  label: string;
  durationMinutes: number;
  rate: number;
  budget: number;
  locale: string;
  status: PrimaryApprovalSummaryStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    rate: number,
    budget: number,
    locale: string,
    status: PrimaryApprovalSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.budget = budget;
    this.locale = locale;
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

  canMoveTo(next: PrimaryApprovalSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: PrimaryApprovalSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary approval summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.rate - this.budget) * 100) / 100;
  }

  copy(): PrimaryApprovalSummary {
    return new PrimaryApprovalSummary(
      this.code,
      this.label,
      this.durationMinutes,
      this.rate,
      this.budget,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary approval summary in status idle. */
export function newPrimaryApprovalSummary(code: string, label: string): PrimaryApprovalSummary {
  return new PrimaryApprovalSummary(code, label, 0, 0, 0, "", "idle");
}
