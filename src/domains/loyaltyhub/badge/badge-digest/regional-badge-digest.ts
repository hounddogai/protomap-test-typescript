/**
 * The regional badge digest records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional badge digest is in its life cycle. */
export type RegionalBadgeDigestStatus = "created" | "validated" | "published" | "retired";

/** The record of a regional badge digest and its current status. */
export class RegionalBadgeDigest {
  code: string;
  name: string;
  clicks: number;
  locale: string;
  unit: string;
  active: boolean;
  cost: number;
  batchSize: number;
  status: RegionalBadgeDigestStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    locale: string,
    unit: string,
    active: boolean,
    cost: number,
    batchSize: number,
    status: RegionalBadgeDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.locale = locale;
    this.unit = unit;
    this.active = active;
    this.cost = cost;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalBadgeDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalBadgeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional badge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.cost + this.batchSize) * 100) / 100;
  }

  copy(): RegionalBadgeDigest {
    return new RegionalBadgeDigest(
      this.code,
      this.name,
      this.clicks,
      this.locale,
      this.unit,
      this.active,
      this.cost,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional badge digest in status created. */
export function newRegionalBadgeDigest(code: string, name: string): RegionalBadgeDigest {
  return new RegionalBadgeDigest(code, name, 0, "", "", false, 0, 0, "created");
}
