/**
 * The legacy cohort claim records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy cohort claim is in its life cycle. */
export type LegacyCohortClaimStatus = "created" | "validated" | "published" | "retired";

/** A legacy cohort claim as the cohort team keeps it. */
export class LegacyCohortClaim {
  code: string;
  title: string;
  version: number;
  channel: string;
  floorValue: number;
  expiresAt: number;
  approved: boolean;
  status: LegacyCohortClaimStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    channel: string,
    floorValue: number,
    expiresAt: number,
    approved: boolean,
    status: LegacyCohortClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.channel = channel;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyCohortClaimStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyCohortClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy cohort claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.floorValue + this.version) * 100) / 100;
  }

  copy(): LegacyCohortClaim {
    return new LegacyCohortClaim(
      this.code,
      this.title,
      this.version,
      this.channel,
      this.floorValue,
      this.expiresAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy cohort claim in status created. */
export function newLegacyCohortClaim(code: string, title: string): LegacyCohortClaim {
  return new LegacyCohortClaim(code, title, 0, "", 0, 0, false, "created");
}
