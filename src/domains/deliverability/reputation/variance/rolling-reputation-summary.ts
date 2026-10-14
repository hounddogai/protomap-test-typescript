import * as text from "../../../../kit/text.js";

/** Where a rolling reputation summary is in its life cycle. */
export type RollingReputationSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling reputation summary. Its code is unique within a tenant. */
export class RollingReputationSummary {
  code: string;
  title: string;
  priority: number;
  timezone: string;
  rate: number;
  bid: number;
  locale: string;
  budget: number;
  sequence: number;
  status: RollingReputationSummaryStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    timezone: string,
    rate: number,
    bid: number,
    locale: string,
    budget: number,
    sequence: number,
    status: RollingReputationSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.timezone = timezone;
    this.rate = rate;
    this.bid = bid;
    this.locale = locale;
    this.budget = budget;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingReputationSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingReputationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reputation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling reputation summary"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget + this.sequence) * 100) / 100;
  }

  copy(): RollingReputationSummary {
    return new RollingReputationSummary(
      this.code,
      this.title,
      this.priority,
      this.timezone,
      this.rate,
      this.bid,
      this.locale,
      this.budget,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling reputation summary in status planned. */
export function newRollingReputationSummary(code: string, title: string): RollingReputationSummary {
  return new RollingReputationSummary(code, title, 0, "", 0, 0, "", 0, 0, "planned");
}
