/**
 * The rolling opt out agreement records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling opt out agreement is in its life cycle. */
export type RollingOptOutAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling opt out agreement and its current status. */
export class RollingOptOutAgreement {
  code: string;
  label: string;
  region: string;
  revision: number;
  graceDays: number;
  description: string;
  checksum: string;
  country: string;
  locale: string;
  status: RollingOptOutAgreementStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    revision: number,
    graceDays: number,
    description: string,
    checksum: string,
    country: string,
    locale: string,
    status: RollingOptOutAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.revision = revision;
    this.graceDays = graceDays;
    this.description = description;
    this.checksum = checksum;
    this.country = country;
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

  canMoveTo(next: RollingOptOutAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: RollingOptOutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling opt out agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round(this.revision * this.graceDays * 100) / 100;
  }

  copy(): RollingOptOutAgreement {
    return new RollingOptOutAgreement(
      this.code,
      this.label,
      this.region,
      this.revision,
      this.graceDays,
      this.description,
      this.checksum,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling opt out agreement in status proposed. */
export function newRollingOptOutAgreement(code: string, label: string): RollingOptOutAgreement {
  return new RollingOptOutAgreement(code, label, "", 0, 0, "", "", "", "", "proposed");
}
