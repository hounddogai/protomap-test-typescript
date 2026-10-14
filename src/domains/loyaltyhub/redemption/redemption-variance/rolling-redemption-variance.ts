/**
 * The rolling redemption variance records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling redemption variance is in its life cycle. */
export type RollingRedemptionVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling redemption variance. Its code is unique within a tenant. */
export class RollingRedemptionVariance {
  code: string;
  name: string;
  source: string;
  version: number;
  region: string;
  status: RollingRedemptionVarianceStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    version: number,
    region: string,
    status: RollingRedemptionVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.version = version;
    this.region = region;
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

  canMoveTo(next: RollingRedemptionVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingRedemptionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling redemption variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): RollingRedemptionVariance {
    return new RollingRedemptionVariance(this.code, this.name, this.source, this.version, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling redemption variance in status open. */
export function newRollingRedemptionVariance(code: string, name: string): RollingRedemptionVariance {
  return new RollingRedemptionVariance(code, name, "", 0, "", "open");
}
