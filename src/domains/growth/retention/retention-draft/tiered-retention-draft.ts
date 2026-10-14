/**
 * The tiered retention draft records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered retention draft is in its life cycle. */
export type TieredRetentionDraftStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered retention draft and its current status. */
export class TieredRetentionDraft {
  code: string;
  name: string;
  region: string;
  openRate: number;
  limit: number;
  discount: number;
  cost: number;
  timezone: string;
  status: TieredRetentionDraftStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    openRate: number,
    limit: number,
    discount: number,
    cost: number,
    timezone: string,
    status: TieredRetentionDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.openRate = openRate;
    this.limit = limit;
    this.discount = discount;
    this.cost = cost;
    this.timezone = timezone;
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

  canMoveTo(next: TieredRetentionDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredRetentionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered retention draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered retention draft"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.openRate - this.limit) * 100) / 100;
  }

  copy(): TieredRetentionDraft {
    return new TieredRetentionDraft(
      this.code,
      this.name,
      this.region,
      this.openRate,
      this.limit,
      this.discount,
      this.cost,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered retention draft in status created. */
export function newTieredRetentionDraft(code: string, name: string): TieredRetentionDraft {
  return new TieredRetentionDraft(code, name, "", 0, 0, 0, 0, "", "created");
}
