/**
 * The legacy double opt in bundle records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy double opt in bundle is in its life cycle. */
export type LegacyDoubleOptInBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy double opt in bundle as the double opt in team keeps it. */
export class LegacyDoubleOptInBundle {
  code: string;
  title: string;
  discount: number;
  limit: number;
  clicks: number;
  attempts: number;
  checksum: string;
  locale: string;
  status: LegacyDoubleOptInBundleStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    limit: number,
    clicks: number,
    attempts: number,
    checksum: string,
    locale: string,
    status: LegacyDoubleOptInBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.limit = limit;
    this.clicks = clicks;
    this.attempts = attempts;
    this.checksum = checksum;
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

  canMoveTo(next: LegacyDoubleOptInBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyDoubleOptInBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy double opt in bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.discount - this.attempts) * 100) / 100;
  }

  copy(): LegacyDoubleOptInBundle {
    return new LegacyDoubleOptInBundle(
      this.code,
      this.title,
      this.discount,
      this.limit,
      this.clicks,
      this.attempts,
      this.checksum,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy double opt in bundle in status proposed. */
export function newLegacyDoubleOptInBundle(code: string, title: string): LegacyDoubleOptInBundle {
  return new LegacyDoubleOptInBundle(code, title, 0, 0, 0, 0, "", "", "proposed");
}
