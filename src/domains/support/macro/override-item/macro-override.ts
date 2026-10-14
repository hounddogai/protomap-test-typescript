/**
 * The macro override records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro override is in its life cycle. */
export type MacroOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A macro override. Its code is unique within a tenant. */
export class MacroOverride {
  code: string;
  label: string;
  contactEmail: string;
  discount: number;
  reviewer: string;
  cost: number;
  ownerId: string;
  clicks: number;
  rate: number;
  startsAt: number;
  status: MacroOverrideStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    discount: number,
    reviewer: string,
    cost: number,
    ownerId: string,
    clicks: number,
    rate: number,
    startsAt: number,
    status: MacroOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.discount = discount;
    this.reviewer = reviewer;
    this.cost = cost;
    this.ownerId = ownerId;
    this.clicks = clicks;
    this.rate = rate;
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

  canMoveTo(next: MacroOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: MacroOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"macro override"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.rate - this.startsAt) * 100) / 100;
  }

  copy(): MacroOverride {
    return new MacroOverride(
      this.code,
      this.label,
      this.contactEmail,
      this.discount,
      this.reviewer,
      this.cost,
      this.ownerId,
      this.clicks,
      this.rate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro override in status proposed. */
export function newMacroOverride(code: string, label: string): MacroOverride {
  return new MacroOverride(code, label, "", 0, "", 0, "", 0, 0, 0, "proposed");
}
