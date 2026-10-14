import * as text from "../../../../kit/text.js";

/** Where a scheduled branch profile is in its life cycle. */
export type ScheduledBranchProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a scheduled branch profile and its current status. */
export class ScheduledBranchProfile {
  code: string;
  name: string;
  bid: number;
  sendAt: number;
  ownerId: string;
  journeyId: string;
  rate: number;
  country: string;
  status: ScheduledBranchProfileStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    sendAt: number,
    ownerId: string,
    journeyId: string,
    rate: number,
    country: string,
    status: ScheduledBranchProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.sendAt = sendAt;
    this.ownerId = ownerId;
    this.journeyId = journeyId;
    this.rate = rate;
    this.country = country;
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

  canMoveTo(next: ScheduledBranchProfileStatus): boolean {
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
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledBranchProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled branch profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled branch profile"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.sendAt * this.bid * 100) / 100;
  }

  copy(): ScheduledBranchProfile {
    return new ScheduledBranchProfile(
      this.code,
      this.name,
      this.bid,
      this.sendAt,
      this.ownerId,
      this.journeyId,
      this.rate,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled branch profile in status planned. */
export function newScheduledBranchProfile(code: string, name: string): ScheduledBranchProfile {
  return new ScheduledBranchProfile(code, name, 0, 0, "", "", 0, "", "planned");
}
