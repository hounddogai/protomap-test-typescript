/**
 * The scheduled frequency profile records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled frequency profile is in its life cycle. */
export type ScheduledFrequencyProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** One scheduled frequency profile, with what the planners need to act on it. */
export class ScheduledFrequencyProfile {
  code: string;
  title: string;
  discount: number;
  startsAt: number;
  ownerId: string;
  name: string;
  approved: boolean;
  status: ScheduledFrequencyProfileStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    startsAt: number,
    ownerId: string,
    name: string,
    approved: boolean,
    status: ScheduledFrequencyProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.name = name;
    this.approved = approved;
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

  canMoveTo(next: ScheduledFrequencyProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledFrequencyProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled frequency profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round((this.discount + this.startsAt) * 100) / 100;
  }

  copy(): ScheduledFrequencyProfile {
    return new ScheduledFrequencyProfile(
      this.code,
      this.title,
      this.discount,
      this.startsAt,
      this.ownerId,
      this.name,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled frequency profile in status requested. */
export function newScheduledFrequencyProfile(code: string, title: string): ScheduledFrequencyProfile {
  return new ScheduledFrequencyProfile(code, title, 0, 0, "", "", false, "requested");
}
