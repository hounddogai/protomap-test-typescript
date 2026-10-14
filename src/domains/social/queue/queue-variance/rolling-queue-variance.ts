/**
 * The rolling queue variance records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling queue variance is in its life cycle. */
export type RollingQueueVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling queue variance, with what the planners need to act on it. */
export class RollingQueueVariance {
  code: string;
  label: string;
  expiresAt: number;
  budget: number;
  audienceId: string;
  limit: number;
  impressions: number;
  retries: number;
  status: RollingQueueVarianceStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    budget: number,
    audienceId: string,
    limit: number,
    impressions: number,
    retries: number,
    status: RollingQueueVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.audienceId = audienceId;
    this.limit = limit;
    this.impressions = impressions;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingQueueVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingQueueVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling queue variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"rolling queue variance"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.impressions - this.limit) * 100) / 100;
  }

  copy(): RollingQueueVariance {
    return new RollingQueueVariance(
      this.code,
      this.label,
      this.expiresAt,
      this.budget,
      this.audienceId,
      this.limit,
      this.impressions,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling queue variance in status proposed. */
export function newRollingQueueVariance(code: string, label: string): RollingQueueVariance {
  return new RollingQueueVariance(code, label, 0, 0, "", 0, 0, 0, "proposed");
}
