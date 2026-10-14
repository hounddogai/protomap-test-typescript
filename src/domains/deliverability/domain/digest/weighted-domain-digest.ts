/**
 * The weighted domain digest records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted domain digest is in its life cycle. */
export type WeightedDomainDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted domain digest and its current status. */
export class WeightedDomainDigest {
  code: string;
  title: string;
  archived: boolean;
  graceDays: number;
  openRate: number;
  currency: string;
  locale: string;
  phone: string;
  version: number;
  floorValue: number;
  status: WeightedDomainDigestStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    graceDays: number,
    openRate: number,
    currency: string,
    locale: string,
    phone: string,
    version: number,
    floorValue: number,
    status: WeightedDomainDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.currency = currency;
    this.locale = locale;
    this.phone = phone;
    this.version = version;
    this.floorValue = floorValue;
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

  canMoveTo(next: WeightedDomainDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedDomainDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted domain digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.openRate + this.floorValue) * 100) / 100;
  }

  copy(): WeightedDomainDigest {
    return new WeightedDomainDigest(
      this.code,
      this.title,
      this.archived,
      this.graceDays,
      this.openRate,
      this.currency,
      this.locale,
      this.phone,
      this.version,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted domain digest in status proposed. */
export function newWeightedDomainDigest(code: string, title: string): WeightedDomainDigest {
  return new WeightedDomainDigest(code, title, false, 0, 0, "", "", "", 0, 0, "proposed");
}
