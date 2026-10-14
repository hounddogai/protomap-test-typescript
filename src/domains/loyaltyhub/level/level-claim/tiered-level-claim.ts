/**
 * The tiered level claim records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered level claim is in its life cycle. */
export type TieredLevelClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a tiered level claim and its current status. */
export class TieredLevelClaim {
  code: string;
  title: string;
  attempts: number;
  cost: number;
  tags: string[];
  country: string;
  status: TieredLevelClaimStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    cost: number,
    tags: string[],
    country: string,
    status: TieredLevelClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.cost = cost;
    this.tags = tags;
    this.country = country;
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

  canMoveTo(next: TieredLevelClaimStatus): boolean {
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredLevelClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered level claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered level claim"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.cost + this.attempts) * 100) / 100;
  }

  copy(): TieredLevelClaim {
    return new TieredLevelClaim(this.code, this.title, this.attempts, this.cost, this.tags, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered level claim in status requested. */
export function newTieredLevelClaim(code: string, title: string): TieredLevelClaim {
  return new TieredLevelClaim(code, title, 0, 0, [], "", "requested");
}
