import * as text from "../../../../kit/text.js";

/** Where a rolling subscription summary is in its life cycle. */
export type RollingSubscriptionSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling subscription summary. Its code is unique within a tenant. */
export class RollingSubscriptionSummary {
  code: string;
  name: string;
  maximum: number;
  clicks: number;
  minimum: number;
  cohort: string;
  sendAt: number;
  limit: number;
  updatedAt: number;
  sequence: number;
  retries: number;
  status: RollingSubscriptionSummaryStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    clicks: number,
    minimum: number,
    cohort: string,
    sendAt: number,
    limit: number,
    updatedAt: number,
    sequence: number,
    retries: number,
    status: RollingSubscriptionSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.clicks = clicks;
    this.minimum = minimum;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.limit = limit;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.retries = retries;
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

  canMoveTo(next: RollingSubscriptionSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingSubscriptionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling subscription summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round(this.limit * this.sequence * 100) / 100;
  }

  copy(): RollingSubscriptionSummary {
    return new RollingSubscriptionSummary(
      this.code,
      this.name,
      this.maximum,
      this.clicks,
      this.minimum,
      this.cohort,
      this.sendAt,
      this.limit,
      this.updatedAt,
      this.sequence,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling subscription summary in status proposed. */
export function newRollingSubscriptionSummary(code: string, name: string): RollingSubscriptionSummary {
  return new RollingSubscriptionSummary(code, name, 0, 0, 0, "", 0, 0, 0, 0, 0, "proposed");
}
