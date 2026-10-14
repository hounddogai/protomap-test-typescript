/**
 * The strict invite metric records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict invite metric is in its life cycle. */
export type StrictInviteMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a strict invite metric and its current status. */
export class StrictInviteMetric {
  code: string;
  name: string;
  budget: number;
  notes: string;
  contactEmail: string;
  status: StrictInviteMetricStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    notes: string,
    contactEmail: string,
    status: StrictInviteMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.notes = notes;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictInviteMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictInviteMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict invite metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict invite metric"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): StrictInviteMetric {
    return new StrictInviteMetric(this.code, this.name, this.budget, this.notes, this.contactEmail, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict invite metric in status draft. */
export function newStrictInviteMetric(code: string, name: string): StrictInviteMetric {
  return new StrictInviteMetric(code, name, 0, "", "", "draft");
}
