/**
 * The rolling credit segment records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling credit segment is in its life cycle. */
export type RollingCreditSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling credit segment as the credit team keeps it. */
export class RollingCreditSegment {
  code: string;
  title: string;
  budget: number;
  cohort: string;
  ceiling: number;
  expiresAt: number;
  source: string;
  weight: number;
  score: number;
  bid: number;
  tags: string[];
  status: RollingCreditSegmentStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    cohort: string,
    ceiling: number,
    expiresAt: number,
    source: string,
    weight: number,
    score: number,
    bid: number,
    tags: string[],
    status: RollingCreditSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.cohort = cohort;
    this.ceiling = ceiling;
    this.expiresAt = expiresAt;
    this.source = source;
    this.weight = weight;
    this.score = score;
    this.bid = bid;
    this.tags = tags;
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

  canMoveTo(next: RollingCreditSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingCreditSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling credit segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.bid * this.expiresAt * 100) / 100;
  }

  copy(): RollingCreditSegment {
    return new RollingCreditSegment(
      this.code,
      this.title,
      this.budget,
      this.cohort,
      this.ceiling,
      this.expiresAt,
      this.source,
      this.weight,
      this.score,
      this.bid,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling credit segment in status requested. */
export function newRollingCreditSegment(code: string, title: string): RollingCreditSegment {
  return new RollingCreditSegment(code, title, 0, "", 0, 0, "", 0, 0, 0, [], "requested");
}
