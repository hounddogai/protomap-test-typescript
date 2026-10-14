/**
 * The adaptive ticket view summary records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive ticket view summary is in its life cycle. */
export type AdaptiveTicketViewSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One adaptive ticket view summary, with what the planners need to act on it. */
export class AdaptiveTicketViewSummary {
  code: string;
  label: string;
  segment: string;
  timezone: string;
  country: string;
  discount: number;
  limit: number;
  windowDays: number;
  source: string;
  status: AdaptiveTicketViewSummaryStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    timezone: string,
    country: string,
    discount: number,
    limit: number,
    windowDays: number,
    source: string,
    status: AdaptiveTicketViewSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.timezone = timezone;
    this.country = country;
    this.discount = discount;
    this.limit = limit;
    this.windowDays = windowDays;
    this.source = source;
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

  canMoveTo(next: AdaptiveTicketViewSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveTicketViewSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive ticket view summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.limit - this.discount) * 100) / 100;
  }

  copy(): AdaptiveTicketViewSummary {
    return new AdaptiveTicketViewSummary(
      this.code,
      this.label,
      this.segment,
      this.timezone,
      this.country,
      this.discount,
      this.limit,
      this.windowDays,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive ticket view summary in status proposed. */
export function newAdaptiveTicketViewSummary(code: string, label: string): AdaptiveTicketViewSummary {
  return new AdaptiveTicketViewSummary(code, label, "", "", "", 0, 0, 0, "", "proposed");
}
