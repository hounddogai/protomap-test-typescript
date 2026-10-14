/**
 * The regional reputation bundle records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional reputation bundle is in its life cycle. */
export type RegionalReputationBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a regional reputation bundle and its current status. */
export class RegionalReputationBundle {
  code: string;
  title: string;
  unit: string;
  discount: number;
  variant: string;
  audienceId: string;
  limit: number;
  impressions: number;
  attempts: number;
  status: RegionalReputationBundleStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    discount: number,
    variant: string,
    audienceId: string,
    limit: number,
    impressions: number,
    attempts: number,
    status: RegionalReputationBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.discount = discount;
    this.variant = variant;
    this.audienceId = audienceId;
    this.limit = limit;
    this.impressions = impressions;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalReputationBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalReputationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reputation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.impressions * this.limit * 100) / 100;
  }

  copy(): RegionalReputationBundle {
    return new RegionalReputationBundle(
      this.code,
      this.title,
      this.unit,
      this.discount,
      this.variant,
      this.audienceId,
      this.limit,
      this.impressions,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a regional reputation bundle in status new. */
export function newRegionalReputationBundle(code: string, title: string): RegionalReputationBundle {
  return new RegionalReputationBundle(code, title, "", 0, "", "", 0, 0, 0, "new");
}
