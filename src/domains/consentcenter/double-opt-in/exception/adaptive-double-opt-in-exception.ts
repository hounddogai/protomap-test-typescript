/**
 * The adaptive double opt in exception records of consentcenter's double opt in work, and the rules, stores,
 * and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive double opt in exception is in its life cycle. */
export type AdaptiveDoubleOptInExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive double opt in exception as the double opt in team keeps it. */
export class AdaptiveDoubleOptInException {
  code: string;
  name: string;
  variant: string;
  conversionRate: number;
  summary: string;
  label: string;
  country: string;
  version: number;
  timezone: string;
  status: AdaptiveDoubleOptInExceptionStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    conversionRate: number,
    summary: string,
    label: string,
    country: string,
    version: number,
    timezone: string,
    status: AdaptiveDoubleOptInExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.conversionRate = conversionRate;
    this.summary = summary;
    this.label = label;
    this.country = country;
    this.version = version;
    this.timezone = timezone;
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

  canMoveTo(next: AdaptiveDoubleOptInExceptionStatus): boolean {
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

  moveTo(next: AdaptiveDoubleOptInExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive double opt in exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.version * this.conversionRate * 100) / 100;
  }

  copy(): AdaptiveDoubleOptInException {
    return new AdaptiveDoubleOptInException(
      this.code,
      this.name,
      this.variant,
      this.conversionRate,
      this.summary,
      this.label,
      this.country,
      this.version,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive double opt in exception in status requested. */
export function newAdaptiveDoubleOptInException(code: string, name: string): AdaptiveDoubleOptInException {
  return new AdaptiveDoubleOptInException(code, name, "", 0, "", "", "", 0, "", "requested");
}
