/**
 * The regional retention forecast records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional retention forecast is in its life cycle. */
export type RegionalRetentionForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional retention forecast. Its code is unique within a tenant. */
export class RegionalRetentionForecast {
  code: string;
  label: string;
  weight: number;
  campaignRef: string;
  contactEmail: string;
  cost: number;
  openRate: number;
  version: number;
  floorValue: number;
  expiresAt: number;
  locale: string;
  status: RegionalRetentionForecastStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    campaignRef: string,
    contactEmail: string,
    cost: number,
    openRate: number,
    version: number,
    floorValue: number,
    expiresAt: number,
    locale: string,
    status: RegionalRetentionForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.openRate = openRate;
    this.version = version;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.locale = locale;
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

  canMoveTo(next: RegionalRetentionForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalRetentionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional retention forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.cost - this.openRate) * 100) / 100;
  }

  copy(): RegionalRetentionForecast {
    return new RegionalRetentionForecast(
      this.code,
      this.label,
      this.weight,
      this.campaignRef,
      this.contactEmail,
      this.cost,
      this.openRate,
      this.version,
      this.floorValue,
      this.expiresAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional retention forecast in status proposed. */
export function newRegionalRetentionForecast(code: string, label: string): RegionalRetentionForecast {
  return new RegionalRetentionForecast(code, label, 0, "", "", 0, 0, 0, 0, 0, "", "proposed");
}
