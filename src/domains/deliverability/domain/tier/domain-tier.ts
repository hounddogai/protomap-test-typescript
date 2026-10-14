/**
 * The domain tier records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain tier is in its life cycle. */
export type DomainTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A domain tier as the domain team keeps it. */
export class DomainTier {
  code: string;
  label: string;
  campaignRef: string;
  durationMinutes: number;
  limit: number;
  locale: string;
  status: DomainTierStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    durationMinutes: number,
    limit: number,
    locale: string,
    status: DomainTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.durationMinutes = durationMinutes;
    this.limit = limit;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.limit * this.durationMinutes * 100) / 100;
  }

  copy(): DomainTier {
    return new DomainTier(
      this.code,
      this.label,
      this.campaignRef,
      this.durationMinutes,
      this.limit,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a domain tier in status draft. */
export function newDomainTier(code: string, label: string): DomainTier {
  return new DomainTier(code, label, "", 0, 0, "", "draft");
}
