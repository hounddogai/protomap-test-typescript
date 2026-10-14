/**
 * The paywall summary records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall summary is in its life cycle. */
export type PaywallSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One paywall summary, with what the planners need to act on it. */
export class PaywallSummary {
  code: string;
  label: string;
  approved: boolean;
  channel: string;
  timezone: string;
  margin: number;
  status: PaywallSummaryStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    channel: string,
    timezone: string,
    margin: number,
    status: PaywallSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.channel = channel;
    this.timezone = timezone;
    this.margin = margin;
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

  canMoveTo(next: PaywallSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): PaywallSummary {
    return new PaywallSummary(
      this.code,
      this.label,
      this.approved,
      this.channel,
      this.timezone,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall summary in status proposed. */
export function newPaywallSummary(code: string, label: string): PaywallSummary {
  return new PaywallSummary(code, label, false, "", "", 0, "proposed");
}
