/**
 * The regional domain rollup records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional domain rollup is in its life cycle. */
export type RegionalDomainRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional domain rollup. Its code is unique within a tenant. */
export class RegionalDomainRollup {
  code: string;
  name: string;
  weight: number;
  variant: string;
  utmSource: string;
  status: RegionalDomainRollupStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    variant: string,
    utmSource: string,
    status: RegionalDomainRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.variant = variant;
    this.utmSource = utmSource;
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

  canMoveTo(next: RegionalDomainRollupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalDomainRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional domain rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional domain rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): RegionalDomainRollup {
    return new RegionalDomainRollup(this.code, this.name, this.weight, this.variant, this.utmSource, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional domain rollup in status open. */
export function newRegionalDomainRollup(code: string, name: string): RegionalDomainRollup {
  return new RegionalDomainRollup(code, name, 0, "", "", "open");
}
