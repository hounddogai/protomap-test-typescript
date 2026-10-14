/**
 * The placement policy records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement policy is in its life cycle. */
export type PlacementPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One placement policy, with what the planners need to act on it. */
export class PlacementPolicy {
  code: string;
  title: string;
  graceDays: number;
  conversionRate: number;
  locale: string;
  reviewer: string;
  campaignRef: string;
  startsAt: number;
  status: PlacementPolicyStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    conversionRate: number,
    locale: string,
    reviewer: string,
    campaignRef: string,
    startsAt: number,
    status: PlacementPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.reviewer = reviewer;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
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

  canMoveTo(next: PlacementPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PlacementPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.conversionRate + this.graceDays) * 100) / 100;
  }

  copy(): PlacementPolicy {
    return new PlacementPolicy(
      this.code,
      this.title,
      this.graceDays,
      this.conversionRate,
      this.locale,
      this.reviewer,
      this.campaignRef,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement policy in status open. */
export function newPlacementPolicy(code: string, title: string): PlacementPolicy {
  return new PlacementPolicy(code, title, 0, 0, "", "", "", 0, "open");
}
