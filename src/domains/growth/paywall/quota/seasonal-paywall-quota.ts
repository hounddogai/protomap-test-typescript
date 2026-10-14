/**
 * The seasonal paywall quota records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall quota is in its life cycle. */
export type SeasonalPaywallQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal paywall quota as the paywall team keeps it. */
export class SeasonalPaywallQuota {
  code: string;
  label: string;
  frequencyCap: number;
  cohort: string;
  createdAt: number;
  phone: string;
  attempts: number;
  status: SeasonalPaywallQuotaStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    cohort: string,
    createdAt: number,
    phone: string,
    attempts: number,
    status: SeasonalPaywallQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.phone = phone;
    this.attempts = attempts;
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

  canMoveTo(next: SeasonalPaywallQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalPaywallQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal paywall quota"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.frequencyCap * this.createdAt * 100) / 100;
  }

  copy(): SeasonalPaywallQuota {
    return new SeasonalPaywallQuota(
      this.code,
      this.label,
      this.frequencyCap,
      this.cohort,
      this.createdAt,
      this.phone,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal paywall quota in status requested. */
export function newSeasonalPaywallQuota(code: string, label: string): SeasonalPaywallQuota {
  return new SeasonalPaywallQuota(code, label, 0, "", 0, "", 0, "requested");
}
