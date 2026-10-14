/**
 * The tiered suppression segment records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered suppression segment is in its life cycle. */
export type TieredSuppressionSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered suppression segment as the suppression team keeps it. */
export class TieredSuppressionSegment {
  code: string;
  name: string;
  approved: boolean;
  conversionRate: number;
  externalRef: string;
  pinned: boolean;
  expiresAt: number;
  channel: string;
  status: TieredSuppressionSegmentStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    conversionRate: number,
    externalRef: string,
    pinned: boolean,
    expiresAt: number,
    channel: string,
    status: TieredSuppressionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.expiresAt = expiresAt;
    this.channel = channel;
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

  canMoveTo(next: TieredSuppressionSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredSuppressionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered suppression segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.expiresAt * this.conversionRate * 100) / 100;
  }

  copy(): TieredSuppressionSegment {
    return new TieredSuppressionSegment(
      this.code,
      this.name,
      this.approved,
      this.conversionRate,
      this.externalRef,
      this.pinned,
      this.expiresAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered suppression segment in status requested. */
export function newTieredSuppressionSegment(code: string, name: string): TieredSuppressionSegment {
  return new TieredSuppressionSegment(code, name, false, 0, "", false, 0, "", "requested");
}
