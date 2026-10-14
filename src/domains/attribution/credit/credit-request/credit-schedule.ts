import * as text from "../../../../kit/text.js";

/** Where a credit schedule is in its life cycle. */
export type CreditScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a credit schedule and its current status. */
export class CreditSchedule {
  code: string;
  title: string;
  campaignRef: string;
  version: number;
  limit: number;
  startsAt: number;
  status: CreditScheduleStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    version: number,
    limit: number,
    startsAt: number,
    status: CreditScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.version = version;
    this.limit = limit;
    this.startsAt = startsAt;
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

  canMoveTo(next: CreditScheduleStatus): boolean {
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

  moveTo(next: CreditScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netVolume(): number {
    return Math.round(this.limit * this.startsAt * 100) / 100;
  }

  copy(): CreditSchedule {
    return new CreditSchedule(
      this.code,
      this.title,
      this.campaignRef,
      this.version,
      this.limit,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit schedule in status proposed. */
export function newCreditSchedule(code: string, title: string): CreditSchedule {
  return new CreditSchedule(code, title, "", 0, 0, 0, "proposed");
}
