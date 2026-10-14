/**
 * The fallback badge digest records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback badge digest is in its life cycle. */
export type FallbackBadgeDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback badge digest. Its code is unique within a tenant. */
export class FallbackBadgeDigest {
  code: string;
  label: string;
  threshold: number;
  score: number;
  windowDays: number;
  locale: string;
  rate: number;
  createdAt: number;
  category: string;
  capacity: number;
  status: FallbackBadgeDigestStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    score: number,
    windowDays: number,
    locale: string,
    rate: number,
    createdAt: number,
    category: string,
    capacity: number,
    status: FallbackBadgeDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.score = score;
    this.windowDays = windowDays;
    this.locale = locale;
    this.rate = rate;
    this.createdAt = createdAt;
    this.category = category;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackBadgeDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackBadgeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback badge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round((this.createdAt - this.rate) * 100) / 100;
  }

  copy(): FallbackBadgeDigest {
    return new FallbackBadgeDigest(
      this.code,
      this.label,
      this.threshold,
      this.score,
      this.windowDays,
      this.locale,
      this.rate,
      this.createdAt,
      this.category,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback badge digest in status planned. */
export function newFallbackBadgeDigest(code: string, label: string): FallbackBadgeDigest {
  return new FallbackBadgeDigest(code, label, 0, 0, 0, "", 0, 0, "", 0, "planned");
}
