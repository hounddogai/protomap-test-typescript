/**
 * The regional redemption group records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional redemption group is in its life cycle. */
export type RegionalRedemptionGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a regional redemption group and its current status. */
export class RegionalRedemptionGroup {
  code: string;
  name: string;
  rate: number;
  endsAt: number;
  locale: string;
  country: string;
  channel: string;
  status: RegionalRedemptionGroupStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    endsAt: number,
    locale: string,
    country: string,
    channel: string,
    status: RegionalRedemptionGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.endsAt = endsAt;
    this.locale = locale;
    this.country = country;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalRedemptionGroupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalRedemptionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional redemption group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.rate * this.endsAt * 100) / 100;
  }

  copy(): RegionalRedemptionGroup {
    return new RegionalRedemptionGroup(
      this.code,
      this.name,
      this.rate,
      this.endsAt,
      this.locale,
      this.country,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional redemption group in status open. */
export function newRegionalRedemptionGroup(code: string, name: string): RegionalRedemptionGroup {
  return new RegionalRedemptionGroup(code, name, 0, 0, "", "", "", "open");
}
