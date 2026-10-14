/**
 * The tiered post rollup records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered post rollup is in its life cycle. */
export type TieredPostRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered post rollup as the post team keeps it. */
export class TieredPostRollup {
  code: string;
  name: string;
  weight: number;
  description: string;
  impressions: number;
  externalRef: string;
  source: string;
  attempts: number;
  status: TieredPostRollupStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    description: string,
    impressions: number,
    externalRef: string,
    source: string,
    attempts: number,
    status: TieredPostRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.description = description;
    this.impressions = impressions;
    this.externalRef = externalRef;
    this.source = source;
    this.attempts = attempts;
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

  canMoveTo(next: TieredPostRollupStatus): boolean {
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

  moveTo(next: TieredPostRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered post rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered post rollup"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.attempts + this.impressions) * 100) / 100;
  }

  copy(): TieredPostRollup {
    return new TieredPostRollup(
      this.code,
      this.name,
      this.weight,
      this.description,
      this.impressions,
      this.externalRef,
      this.source,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered post rollup in status proposed. */
export function newTieredPostRollup(code: string, name: string): TieredPostRollup {
  return new TieredPostRollup(code, name, 0, "", 0, "", "", 0, "proposed");
}
