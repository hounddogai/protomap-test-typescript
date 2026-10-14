/**
 * The opt out tier records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out tier is in its life cycle. */
export type OptOutTierStatus = "created" | "validated" | "published" | "retired";

/** One opt out tier, with what the planners need to act on it. */
export class OptOutTier {
  code: string;
  title: string;
  updatedAt: number;
  margin: number;
  region: string;
  pinned: boolean;
  timezone: string;
  budget: number;
  status: OptOutTierStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    margin: number,
    region: string,
    pinned: boolean,
    timezone: string,
    budget: number,
    status: OptOutTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.margin = margin;
    this.region = region;
    this.pinned = pinned;
    this.timezone = timezone;
    this.budget = budget;
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

  canMoveTo(next: OptOutTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: OptOutTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.margin + this.updatedAt) * 100) / 100;
  }

  copy(): OptOutTier {
    return new OptOutTier(
      this.code,
      this.title,
      this.updatedAt,
      this.margin,
      this.region,
      this.pinned,
      this.timezone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out tier in status created. */
export function newOptOutTier(code: string, title: string): OptOutTier {
  return new OptOutTier(code, title, 0, 0, "", false, "", 0, "created");
}
