import * as text from "../../../../kit/text.js";

/** Where a streak summary is in its life cycle. */
export type StreakSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One streak summary, with what the planners need to act on it. */
export class StreakSummary {
  code: string;
  name: string;
  reviewer: string;
  conversionRate: number;
  windowDays: number;
  phone: string;
  status: StreakSummaryStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    conversionRate: number,
    windowDays: number,
    phone: string,
    status: StreakSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.windowDays = windowDays;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StreakSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.conversionRate + this.windowDays) * 100) / 100;
  }

  copy(): StreakSummary {
    return new StreakSummary(
      this.code,
      this.name,
      this.reviewer,
      this.conversionRate,
      this.windowDays,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a streak summary in status proposed. */
export function newStreakSummary(code: string, name: string): StreakSummary {
  return new StreakSummary(code, name, "", 0, 0, "", "proposed");
}
