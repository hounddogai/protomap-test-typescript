/**
 * The pending csat digest records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending csat digest is in its life cycle. */
export type PendingCsatDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a pending csat digest and its current status. */
export class PendingCsatDigest {
  code: string;
  label: string;
  description: string;
  active: boolean;
  minimum: number;
  currency: string;
  retries: number;
  createdAt: number;
  status: PendingCsatDigestStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    active: boolean,
    minimum: number,
    currency: string,
    retries: number,
    createdAt: number,
    status: PendingCsatDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.active = active;
    this.minimum = minimum;
    this.currency = currency;
    this.retries = retries;
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

  canMoveTo(next: PendingCsatDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingCsatDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending csat digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round(this.createdAt * this.minimum * 100) / 100;
  }

  copy(): PendingCsatDigest {
    return new PendingCsatDigest(
      this.code,
      this.label,
      this.description,
      this.active,
      this.minimum,
      this.currency,
      this.retries,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending csat digest in status requested. */
export function newPendingCsatDigest(code: string, label: string): PendingCsatDigest {
  return new PendingCsatDigest(code, label, "", false, 0, "", 0, 0, "requested");
}
