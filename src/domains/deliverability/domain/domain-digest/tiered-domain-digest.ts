/**
 * The tiered domain digest records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered domain digest is in its life cycle. */
export type TieredDomainDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered domain digest. Its code is unique within a tenant. */
export class TieredDomainDigest {
  code: string;
  label: string;
  utmSource: string;
  openRate: number;
  segment: string;
  visible: boolean;
  status: TieredDomainDigestStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    openRate: number,
    segment: string,
    visible: boolean,
    status: TieredDomainDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.segment = segment;
    this.visible = visible;
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

  canMoveTo(next: TieredDomainDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
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

  moveTo(next: TieredDomainDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered domain digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered domain digest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): TieredDomainDigest {
    return new TieredDomainDigest(
      this.code,
      this.label,
      this.utmSource,
      this.openRate,
      this.segment,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered domain digest in status requested. */
export function newTieredDomainDigest(code: string, label: string): TieredDomainDigest {
  return new TieredDomainDigest(code, label, "", 0, "", false, "requested");
}
