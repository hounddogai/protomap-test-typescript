/**
 * The tiered badge profile records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered badge profile is in its life cycle. */
export type TieredBadgeProfileStatus = "created" | "validated" | "published" | "retired";

/** A tiered badge profile as the badge team keeps it. */
export class TieredBadgeProfile {
  code: string;
  title: string;
  region: string;
  amount: number;
  ratio: number;
  openRate: number;
  priority: number;
  sequence: number;
  variant: string;
  status: TieredBadgeProfileStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    amount: number,
    ratio: number,
    openRate: number,
    priority: number,
    sequence: number,
    variant: string,
    status: TieredBadgeProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.amount = amount;
    this.ratio = ratio;
    this.openRate = openRate;
    this.priority = priority;
    this.sequence = sequence;
    this.variant = variant;
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

  canMoveTo(next: TieredBadgeProfileStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredBadgeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered badge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.sequence - this.amount) * 100) / 100;
  }

  copy(): TieredBadgeProfile {
    return new TieredBadgeProfile(
      this.code,
      this.title,
      this.region,
      this.amount,
      this.ratio,
      this.openRate,
      this.priority,
      this.sequence,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered badge profile in status created. */
export function newTieredBadgeProfile(code: string, title: string): TieredBadgeProfile {
  return new TieredBadgeProfile(code, title, "", 0, 0, 0, 0, 0, "", "created");
}
