/**
 * The lenient mention claim records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient mention claim is in its life cycle. */
export type LenientMentionClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient mention claim. Its code is unique within a tenant. */
export class LenientMentionClaim {
  code: string;
  title: string;
  batchSize: number;
  createdAt: number;
  score: number;
  utmSource: string;
  rate: number;
  impressions: number;
  country: string;
  floorValue: number;
  status: LenientMentionClaimStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    createdAt: number,
    score: number,
    utmSource: string,
    rate: number,
    impressions: number,
    country: string,
    floorValue: number,
    status: LenientMentionClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.score = score;
    this.utmSource = utmSource;
    this.rate = rate;
    this.impressions = impressions;
    this.country = country;
    this.floorValue = floorValue;
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

  canMoveTo(next: LenientMentionClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientMentionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient mention claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient mention claim"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.score * this.rate * 100) / 100;
  }

  copy(): LenientMentionClaim {
    return new LenientMentionClaim(
      this.code,
      this.title,
      this.batchSize,
      this.createdAt,
      this.score,
      this.utmSource,
      this.rate,
      this.impressions,
      this.country,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient mention claim in status draft. */
export function newLenientMentionClaim(code: string, title: string): LenientMentionClaim {
  return new LenientMentionClaim(code, title, 0, 0, 0, "", 0, 0, "", 0, "draft");
}
