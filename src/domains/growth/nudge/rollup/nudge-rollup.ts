/**
 * The nudge rollup records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge rollup is in its life cycle. */
export type NudgeRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a nudge rollup and its current status. */
export class NudgeRollup {
  code: string;
  name: string;
  bid: number;
  cohort: string;
  externalRef: string;
  active: boolean;
  impressions: number;
  expiresAt: number;
  version: number;
  sequence: number;
  floorValue: number;
  status: NudgeRollupStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    cohort: string,
    externalRef: string,
    active: boolean,
    impressions: number,
    expiresAt: number,
    version: number,
    sequence: number,
    floorValue: number,
    status: NudgeRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.cohort = cohort;
    this.externalRef = externalRef;
    this.active = active;
    this.impressions = impressions;
    this.expiresAt = expiresAt;
    this.version = version;
    this.sequence = sequence;
    this.floorValue = floorValue;
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

  canMoveTo(next: NudgeRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
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

  moveTo(next: NudgeRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"nudge rollup"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.expiresAt - this.floorValue) * 100) / 100;
  }

  copy(): NudgeRollup {
    return new NudgeRollup(
      this.code,
      this.name,
      this.bid,
      this.cohort,
      this.externalRef,
      this.active,
      this.impressions,
      this.expiresAt,
      this.version,
      this.sequence,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a nudge rollup in status proposed. */
export function newNudgeRollup(code: string, name: string): NudgeRollup {
  return new NudgeRollup(code, name, 0, "", "", false, 0, 0, 0, 0, 0, "proposed");
}
