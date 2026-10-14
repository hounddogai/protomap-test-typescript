/**
 * The domain policy records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain policy is in its life cycle. */
export type DomainPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a domain policy and its current status. */
export class DomainPolicy {
  code: string;
  title: string;
  visible: boolean;
  minimum: number;
  amount: number;
  durationMinutes: number;
  approved: boolean;
  utmSource: string;
  summary: string;
  capacity: number;
  startsAt: number;
  status: DomainPolicyStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    minimum: number,
    amount: number,
    durationMinutes: number,
    approved: boolean,
    utmSource: string,
    summary: string,
    capacity: number,
    startsAt: number,
    status: DomainPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.minimum = minimum;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
    this.utmSource = utmSource;
    this.summary = summary;
    this.capacity = capacity;
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

  canMoveTo(next: DomainPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"domain policy"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.amount * this.minimum * 100) / 100;
  }

  copy(): DomainPolicy {
    return new DomainPolicy(
      this.code,
      this.title,
      this.visible,
      this.minimum,
      this.amount,
      this.durationMinutes,
      this.approved,
      this.utmSource,
      this.summary,
      this.capacity,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a domain policy in status proposed. */
export function newDomainPolicy(code: string, title: string): DomainPolicy {
  return new DomainPolicy(code, title, false, 0, 0, 0, false, "", "", 0, 0, "proposed");
}
