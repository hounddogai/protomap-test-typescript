/**
 * The strict queue score records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict queue score is in its life cycle. */
export type StrictQueueScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict queue score. Its code is unique within a tenant. */
export class StrictQueueScore {
  code: string;
  name: string;
  category: string;
  floorValue: number;
  country: string;
  margin: number;
  attempts: number;
  retries: number;
  status: StrictQueueScoreStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    floorValue: number,
    country: string,
    margin: number,
    attempts: number,
    retries: number,
    status: StrictQueueScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.floorValue = floorValue;
    this.country = country;
    this.margin = margin;
    this.attempts = attempts;
    this.retries = retries;
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

  canMoveTo(next: StrictQueueScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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

  moveTo(next: StrictQueueScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict queue score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict queue score"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.floorValue - this.margin) * 100) / 100;
  }

  copy(): StrictQueueScore {
    return new StrictQueueScore(
      this.code,
      this.name,
      this.category,
      this.floorValue,
      this.country,
      this.margin,
      this.attempts,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict queue score in status requested. */
export function newStrictQueueScore(code: string, name: string): StrictQueueScore {
  return new StrictQueueScore(code, name, "", 0, "", 0, 0, 0, "requested");
}
