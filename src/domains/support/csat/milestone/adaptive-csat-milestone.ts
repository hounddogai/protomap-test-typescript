/**
 * The adaptive csat milestone records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive csat milestone is in its life cycle. */
export type AdaptiveCsatMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive csat milestone, with what the planners need to act on it. */
export class AdaptiveCsatMilestone {
  code: string;
  title: string;
  approved: boolean;
  source: string;
  impressions: number;
  limit: number;
  status: AdaptiveCsatMilestoneStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    source: string,
    impressions: number,
    limit: number,
    status: AdaptiveCsatMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.source = source;
    this.impressions = impressions;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveCsatMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveCsatMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive csat milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round(this.limit * this.impressions * 100) / 100;
  }

  copy(): AdaptiveCsatMilestone {
    return new AdaptiveCsatMilestone(
      this.code,
      this.title,
      this.approved,
      this.source,
      this.impressions,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive csat milestone in status draft. */
export function newAdaptiveCsatMilestone(code: string, title: string): AdaptiveCsatMilestone {
  return new AdaptiveCsatMilestone(code, title, false, "", 0, 0, "draft");
}
