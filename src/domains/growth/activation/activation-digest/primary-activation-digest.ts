/**
 * The primary activation digest records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary activation digest is in its life cycle. */
export type PrimaryActivationDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary activation digest. Its code is unique within a tenant. */
export class PrimaryActivationDigest {
  code: string;
  title: string;
  createdAt: number;
  frequencyCap: number;
  budget: number;
  rate: number;
  graceDays: number;
  status: PrimaryActivationDigestStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    frequencyCap: number,
    budget: number,
    rate: number,
    graceDays: number,
    status: PrimaryActivationDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.rate = rate;
    this.graceDays = graceDays;
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

  canMoveTo(next: PrimaryActivationDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryActivationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary activation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary activation digest"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.graceDays * this.budget * 100) / 100;
  }

  copy(): PrimaryActivationDigest {
    return new PrimaryActivationDigest(
      this.code,
      this.title,
      this.createdAt,
      this.frequencyCap,
      this.budget,
      this.rate,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary activation digest in status requested. */
export function newPrimaryActivationDigest(code: string, title: string): PrimaryActivationDigest {
  return new PrimaryActivationDigest(code, title, 0, 0, 0, 0, 0, "requested");
}
