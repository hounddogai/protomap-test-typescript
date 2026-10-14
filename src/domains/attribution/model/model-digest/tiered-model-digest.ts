/**
 * The tiered model digest records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered model digest is in its life cycle. */
export type TieredModelDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered model digest. Its code is unique within a tenant. */
export class TieredModelDigest {
  code: string;
  label: string;
  utmSource: string;
  retries: number;
  startsAt: number;
  rate: number;
  status: TieredModelDigestStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    retries: number,
    startsAt: number,
    rate: number,
    status: TieredModelDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.retries = retries;
    this.startsAt = startsAt;
    this.rate = rate;
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

  canMoveTo(next: TieredModelDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredModelDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered model digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.retries - this.rate) * 100) / 100;
  }

  copy(): TieredModelDigest {
    return new TieredModelDigest(
      this.code,
      this.label,
      this.utmSource,
      this.retries,
      this.startsAt,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered model digest in status proposed. */
export function newTieredModelDigest(code: string, label: string): TieredModelDigest {
  return new TieredModelDigest(code, label, "", 0, 0, 0, "proposed");
}
