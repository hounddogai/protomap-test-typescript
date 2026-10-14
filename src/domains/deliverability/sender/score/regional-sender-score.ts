/**
 * The regional sender score records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional sender score is in its life cycle. */
export type RegionalSenderScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a regional sender score and its current status. */
export class RegionalSenderScore {
  code: string;
  name: string;
  limit: number;
  pinned: boolean;
  frequencyCap: number;
  description: string;
  reviewer: string;
  status: RegionalSenderScoreStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    pinned: boolean,
    frequencyCap: number,
    description: string,
    reviewer: string,
    status: RegionalSenderScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.reviewer = reviewer;
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

  canMoveTo(next: RegionalSenderScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalSenderScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.frequencyCap - this.limit) * 100) / 100;
  }

  copy(): RegionalSenderScore {
    return new RegionalSenderScore(
      this.code,
      this.name,
      this.limit,
      this.pinned,
      this.frequencyCap,
      this.description,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional sender score in status requested. */
export function newRegionalSenderScore(code: string, name: string): RegionalSenderScore {
  return new RegionalSenderScore(code, name, 0, false, 0, "", "", "requested");
}
