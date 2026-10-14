/**
 * The tiered redemption quota records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered redemption quota is in its life cycle. */
export type TieredRedemptionQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered redemption quota as the redemption team keeps it. */
export class TieredRedemptionQuota {
  code: string;
  label: string;
  contactEmail: string;
  frequencyCap: number;
  source: string;
  timezone: string;
  durationMinutes: number;
  threshold: number;
  retries: number;
  name: string;
  status: TieredRedemptionQuotaStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    frequencyCap: number,
    source: string,
    timezone: string,
    durationMinutes: number,
    threshold: number,
    retries: number,
    name: string,
    status: TieredRedemptionQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.threshold = threshold;
    this.retries = retries;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredRedemptionQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredRedemptionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered redemption quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered redemption quota"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.threshold + this.durationMinutes) * 100) / 100;
  }

  copy(): TieredRedemptionQuota {
    return new TieredRedemptionQuota(
      this.code,
      this.label,
      this.contactEmail,
      this.frequencyCap,
      this.source,
      this.timezone,
      this.durationMinutes,
      this.threshold,
      this.retries,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered redemption quota in status planned. */
export function newTieredRedemptionQuota(code: string, label: string): TieredRedemptionQuota {
  return new TieredRedemptionQuota(code, label, "", 0, "", "", 0, 0, 0, "", "planned");
}
