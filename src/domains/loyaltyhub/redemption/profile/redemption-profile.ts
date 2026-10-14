/**
 * The redemption profile records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption profile is in its life cycle. */
export type RedemptionProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A redemption profile. Its code is unique within a tenant. */
export class RedemptionProfile {
  code: string;
  label: string;
  summary: string;
  conversionRate: number;
  revision: number;
  checksum: string;
  cohort: string;
  status: RedemptionProfileStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    conversionRate: number,
    revision: number,
    checksum: string,
    cohort: string,
    status: RedemptionProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.checksum = checksum;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.revision * this.conversionRate * 100) / 100;
  }

  copy(): RedemptionProfile {
    return new RedemptionProfile(
      this.code,
      this.label,
      this.summary,
      this.conversionRate,
      this.revision,
      this.checksum,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption profile in status new. */
export function newRedemptionProfile(code: string, label: string): RedemptionProfile {
  return new RedemptionProfile(code, label, "", 0, 0, "", "", "new");
}
