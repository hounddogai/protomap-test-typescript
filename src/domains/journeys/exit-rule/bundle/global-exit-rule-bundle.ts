/**
 * The global exit rule bundle records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global exit rule bundle is in its life cycle. */
export type GlobalExitRuleBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a global exit rule bundle and its current status. */
export class GlobalExitRuleBundle {
  code: string;
  name: string;
  cost: number;
  active: boolean;
  ratio: number;
  source: string;
  country: string;
  region: string;
  status: GlobalExitRuleBundleStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    active: boolean,
    ratio: number,
    source: string,
    country: string,
    region: string,
    status: GlobalExitRuleBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.active = active;
    this.ratio = ratio;
    this.source = source;
    this.country = country;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalExitRuleBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalExitRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global exit rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global exit rule bundle"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.ratio - this.cost) * 100) / 100;
  }

  copy(): GlobalExitRuleBundle {
    return new GlobalExitRuleBundle(
      this.code,
      this.name,
      this.cost,
      this.active,
      this.ratio,
      this.source,
      this.country,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global exit rule bundle in status idle. */
export function newGlobalExitRuleBundle(code: string, name: string): GlobalExitRuleBundle {
  return new GlobalExitRuleBundle(code, name, 0, false, 0, "", "", "", "idle");
}
