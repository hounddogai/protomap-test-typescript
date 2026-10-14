/**
 * The primary preference group records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary preference group is in its life cycle. */
export type PrimaryPreferenceGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a primary preference group and its current status. */
export class PrimaryPreferenceGroup {
  code: string;
  title: string;
  limit: number;
  discount: number;
  timezone: string;
  status: PrimaryPreferenceGroupStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    discount: number,
    timezone: string,
    status: PrimaryPreferenceGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.discount = discount;
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

  canMoveTo(next: PrimaryPreferenceGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPreferenceGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary preference group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.discount + this.limit) * 100) / 100;
  }

  copy(): PrimaryPreferenceGroup {
    return new PrimaryPreferenceGroup(this.code, this.title, this.limit, this.discount, this.timezone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary preference group in status proposed. */
export function newPrimaryPreferenceGroup(code: string, title: string): PrimaryPreferenceGroup {
  return new PrimaryPreferenceGroup(code, title, 0, 0, "", "proposed");
}
