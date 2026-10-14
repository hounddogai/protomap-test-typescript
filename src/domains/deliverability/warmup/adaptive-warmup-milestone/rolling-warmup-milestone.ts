/**
 * The rolling warmup milestone records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling warmup milestone is in its life cycle. */
export type RollingWarmupMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling warmup milestone as the warmup team keeps it. */
export class RollingWarmupMilestone {
  code: string;
  label: string;
  revision: number;
  frequencyCap: number;
  batchSize: number;
  attempts: number;
  approved: boolean;
  locale: string;
  conversionRate: number;
  summary: string;
  status: RollingWarmupMilestoneStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    frequencyCap: number,
    batchSize: number,
    attempts: number,
    approved: boolean,
    locale: string,
    conversionRate: number,
    summary: string,
    status: RollingWarmupMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.attempts = attempts;
    this.approved = approved;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingWarmupMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWarmupMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling warmup milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round((this.conversionRate - this.batchSize) * 100) / 100;
  }

  copy(): RollingWarmupMilestone {
    return new RollingWarmupMilestone(
      this.code,
      this.label,
      this.revision,
      this.frequencyCap,
      this.batchSize,
      this.attempts,
      this.approved,
      this.locale,
      this.conversionRate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling warmup milestone in status requested. */
export function newRollingWarmupMilestone(code: string, label: string): RollingWarmupMilestone {
  return new RollingWarmupMilestone(code, label, 0, 0, 0, 0, false, "", 0, "", "requested");
}
