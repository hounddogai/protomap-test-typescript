/**
 * The payout metric records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout metric is in its life cycle. */
export type PayoutMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a payout metric and its current status. */
export class PayoutMetric {
  code: string;
  name: string;
  channel: string;
  approved: boolean;
  unit: string;
  reviewer: string;
  clicks: number;
  graceDays: number;
  status: PayoutMetricStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    approved: boolean,
    unit: string,
    reviewer: string,
    clicks: number,
    graceDays: number,
    status: PayoutMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.approved = approved;
    this.unit = unit;
    this.reviewer = reviewer;
    this.clicks = clicks;
    this.graceDays = graceDays;
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

  canMoveTo(next: PayoutMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netExposure(): number {
    return Math.round((this.clicks - this.graceDays) * 100) / 100;
  }

  copy(): PayoutMetric {
    return new PayoutMetric(
      this.code,
      this.name,
      this.channel,
      this.approved,
      this.unit,
      this.reviewer,
      this.clicks,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a payout metric in status proposed. */
export function newPayoutMetric(code: string, name: string): PayoutMetric {
  return new PayoutMetric(code, name, "", false, "", "", 0, 0, "proposed");
}
