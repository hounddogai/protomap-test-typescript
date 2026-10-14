/**
 * The regional creative score records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional creative score is in its life cycle. */
export type RegionalCreativeScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional creative score. Its code is unique within a tenant. */
export class RegionalCreativeScore {
  code: string;
  name: string;
  reviewer: string;
  expiresAt: number;
  checksum: string;
  windowDays: number;
  status: RegionalCreativeScoreStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    expiresAt: number,
    checksum: string,
    windowDays: number,
    status: RegionalCreativeScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalCreativeScoreStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalCreativeScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional creative score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round(this.expiresAt * this.windowDays * 100) / 100;
  }

  copy(): RegionalCreativeScore {
    return new RegionalCreativeScore(
      this.code,
      this.name,
      this.reviewer,
      this.expiresAt,
      this.checksum,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional creative score in status open. */
export function newRegionalCreativeScore(code: string, name: string): RegionalCreativeScore {
  return new RegionalCreativeScore(code, name, "", 0, "", 0, "open");
}
