/**
 * The default challenge variance records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default challenge variance is in its life cycle. */
export type DefaultChallengeVarianceStatus = "created" | "validated" | "published" | "retired";

/** One default challenge variance, with what the planners need to act on it. */
export class DefaultChallengeVariance {
  code: string;
  name: string;
  channel: string;
  ceiling: number;
  graceDays: number;
  frequencyCap: number;
  phone: string;
  checksum: string;
  floorValue: number;
  clicks: number;
  cohort: string;
  status: DefaultChallengeVarianceStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    ceiling: number,
    graceDays: number,
    frequencyCap: number,
    phone: string,
    checksum: string,
    floorValue: number,
    clicks: number,
    cohort: string,
    status: DefaultChallengeVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.ceiling = ceiling;
    this.graceDays = graceDays;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.cohort = cohort;
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

  canMoveTo(next: DefaultChallengeVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultChallengeVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default challenge variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.frequencyCap + this.ceiling) * 100) / 100;
  }

  copy(): DefaultChallengeVariance {
    return new DefaultChallengeVariance(
      this.code,
      this.name,
      this.channel,
      this.ceiling,
      this.graceDays,
      this.frequencyCap,
      this.phone,
      this.checksum,
      this.floorValue,
      this.clicks,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default challenge variance in status created. */
export function newDefaultChallengeVariance(code: string, name: string): DefaultChallengeVariance {
  return new DefaultChallengeVariance(code, name, "", 0, 0, 0, "", "", 0, 0, "", "created");
}
