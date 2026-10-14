import * as text from "../../../../kit/text.js";

/** Where a payout summary is in its life cycle. */
export type PayoutSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** One payout summary, with what the planners need to act on it. */
export class PayoutSummary {
  code: string;
  name: string;
  timezone: string;
  clicks: number;
  segment: string;
  startsAt: number;
  priority: number;
  ceiling: number;
  description: string;
  status: PayoutSummaryStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    clicks: number,
    segment: string,
    startsAt: number,
    priority: number,
    ceiling: number,
    description: string,
    status: PayoutSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.clicks = clicks;
    this.segment = segment;
    this.startsAt = startsAt;
    this.priority = priority;
    this.ceiling = ceiling;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PayoutSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.ceiling + this.startsAt) * 100) / 100;
  }

  copy(): PayoutSummary {
    return new PayoutSummary(
      this.code,
      this.name,
      this.timezone,
      this.clicks,
      this.segment,
      this.startsAt,
      this.priority,
      this.ceiling,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a payout summary in status requested. */
export function newPayoutSummary(code: string, name: string): PayoutSummary {
  return new PayoutSummary(code, name, "", 0, "", 0, 0, 0, "", "requested");
}
