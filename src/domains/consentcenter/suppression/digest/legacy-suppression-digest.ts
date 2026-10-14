/**
 * The legacy suppression digest records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy suppression digest is in its life cycle. */
export type LegacySuppressionDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy suppression digest as the suppression team keeps it. */
export class LegacySuppressionDigest {
  code: string;
  label: string;
  capacity: number;
  minimum: number;
  pinned: boolean;
  frequencyCap: number;
  ceiling: number;
  tags: string[];
  limit: number;
  score: number;
  status: LegacySuppressionDigestStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    minimum: number,
    pinned: boolean,
    frequencyCap: number,
    ceiling: number,
    tags: string[],
    limit: number,
    score: number,
    status: LegacySuppressionDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.minimum = minimum;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
    this.ceiling = ceiling;
    this.tags = tags;
    this.limit = limit;
    this.score = score;
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

  canMoveTo(next: LegacySuppressionDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
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

  moveTo(next: LegacySuppressionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy suppression digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.limit - this.minimum) * 100) / 100;
  }

  copy(): LegacySuppressionDigest {
    return new LegacySuppressionDigest(
      this.code,
      this.label,
      this.capacity,
      this.minimum,
      this.pinned,
      this.frequencyCap,
      this.ceiling,
      this.tags,
      this.limit,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy suppression digest in status requested. */
export function newLegacySuppressionDigest(code: string, label: string): LegacySuppressionDigest {
  return new LegacySuppressionDigest(code, label, 0, 0, false, 0, 0, [], 0, 0, "requested");
}
