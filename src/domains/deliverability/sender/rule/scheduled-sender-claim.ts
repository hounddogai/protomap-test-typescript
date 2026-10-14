import * as text from "../../../../kit/text.js";

/** Where a scheduled sender claim is in its life cycle. */
export type ScheduledSenderClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a scheduled sender claim and its current status. */
export class ScheduledSenderClaim {
  code: string;
  title: string;
  retries: number;
  region: string;
  priority: number;
  timezone: string;
  status: ScheduledSenderClaimStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    region: string,
    priority: number,
    timezone: string,
    status: ScheduledSenderClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.region = region;
    this.priority = priority;
    this.timezone = timezone;
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

  canMoveTo(next: ScheduledSenderClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledSenderClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sender claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled sender claim"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.priority * this.retries * 100) / 100;
  }

  copy(): ScheduledSenderClaim {
    return new ScheduledSenderClaim(
      this.code,
      this.title,
      this.retries,
      this.region,
      this.priority,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled sender claim in status proposed. */
export function newScheduledSenderClaim(code: string, title: string): ScheduledSenderClaim {
  return new ScheduledSenderClaim(code, title, 0, "", 0, "", "proposed");
}
