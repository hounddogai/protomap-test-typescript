/**
 * The global sender group records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global sender group is in its life cycle. */
export type GlobalSenderGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global sender group and its current status. */
export class GlobalSenderGroup {
  code: string;
  label: string;
  impressions: number;
  archived: boolean;
  margin: number;
  budget: number;
  currency: string;
  version: number;
  status: GlobalSenderGroupStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    archived: boolean,
    margin: number,
    budget: number,
    currency: string,
    version: number,
    status: GlobalSenderGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.archived = archived;
    this.margin = margin;
    this.budget = budget;
    this.currency = currency;
    this.version = version;
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

  canMoveTo(next: GlobalSenderGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalSenderGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sender group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.margin * this.version * 100) / 100;
  }

  copy(): GlobalSenderGroup {
    return new GlobalSenderGroup(
      this.code,
      this.label,
      this.impressions,
      this.archived,
      this.margin,
      this.budget,
      this.currency,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global sender group in status proposed. */
export function newGlobalSenderGroup(code: string, label: string): GlobalSenderGroup {
  return new GlobalSenderGroup(code, label, 0, false, 0, 0, "", 0, "proposed");
}
