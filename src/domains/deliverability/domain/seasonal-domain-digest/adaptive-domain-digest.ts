/**
 * The adaptive domain digest records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive domain digest is in its life cycle. */
export type AdaptiveDomainDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive domain digest as the domain team keeps it. */
export class AdaptiveDomainDigest {
  code: string;
  name: string;
  score: number;
  unit: string;
  batchSize: number;
  windowDays: number;
  description: string;
  budget: number;
  category: string;
  status: AdaptiveDomainDigestStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    unit: string,
    batchSize: number,
    windowDays: number,
    description: string,
    budget: number,
    category: string,
    status: AdaptiveDomainDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.unit = unit;
    this.batchSize = batchSize;
    this.windowDays = windowDays;
    this.description = description;
    this.budget = budget;
    this.category = category;
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

  canMoveTo(next: AdaptiveDomainDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveDomainDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive domain digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.windowDays + this.batchSize) * 100) / 100;
  }

  copy(): AdaptiveDomainDigest {
    return new AdaptiveDomainDigest(
      this.code,
      this.name,
      this.score,
      this.unit,
      this.batchSize,
      this.windowDays,
      this.description,
      this.budget,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive domain digest in status planned. */
export function newAdaptiveDomainDigest(code: string, name: string): AdaptiveDomainDigest {
  return new AdaptiveDomainDigest(code, name, 0, "", 0, 0, "", 0, "", "planned");
}
