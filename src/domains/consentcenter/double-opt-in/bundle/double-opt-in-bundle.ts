/**
 * The double opt in bundle records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in bundle is in its life cycle. */
export type DoubleOptInBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A double opt in bundle. Its code is unique within a tenant. */
export class DoubleOptInBundle {
  code: string;
  name: string;
  sendAt: number;
  externalRef: string;
  budget: number;
  country: string;
  reviewer: string;
  createdAt: number;
  status: DoubleOptInBundleStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    externalRef: string,
    budget: number,
    country: string,
    reviewer: string,
    createdAt: number,
    status: DoubleOptInBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.externalRef = externalRef;
    this.budget = budget;
    this.country = country;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
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

  canMoveTo(next: DoubleOptInBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DoubleOptInBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.sendAt * this.budget * 100) / 100;
  }

  copy(): DoubleOptInBundle {
    return new DoubleOptInBundle(
      this.code,
      this.name,
      this.sendAt,
      this.externalRef,
      this.budget,
      this.country,
      this.reviewer,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a double opt in bundle in status requested. */
export function newDoubleOptInBundle(code: string, name: string): DoubleOptInBundle {
  return new DoubleOptInBundle(code, name, 0, "", 0, "", "", 0, "requested");
}
