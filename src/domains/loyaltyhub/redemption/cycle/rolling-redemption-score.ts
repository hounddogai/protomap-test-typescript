import * as text from "../../../../kit/text.js";

/** Where a rolling redemption score is in its life cycle. */
export type RollingRedemptionScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling redemption score. Its code is unique within a tenant. */
export class RollingRedemptionScore {
  code: string;
  title: string;
  utmSource: string;
  category: string;
  budget: number;
  currency: string;
  threshold: number;
  score: number;
  label: string;
  pinned: boolean;
  status: RollingRedemptionScoreStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    category: string,
    budget: number,
    currency: string,
    threshold: number,
    score: number,
    label: string,
    pinned: boolean,
    status: RollingRedemptionScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.category = category;
    this.budget = budget;
    this.currency = currency;
    this.threshold = threshold;
    this.score = score;
    this.label = label;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingRedemptionScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingRedemptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling redemption score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  weightedExposure(): number {
    return Math.round(this.threshold * this.score * 100) / 100;
  }

  copy(): RollingRedemptionScore {
    return new RollingRedemptionScore(
      this.code,
      this.title,
      this.utmSource,
      this.category,
      this.budget,
      this.currency,
      this.threshold,
      this.score,
      this.label,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling redemption score in status idle. */
export function newRollingRedemptionScore(code: string, title: string): RollingRedemptionScore {
  return new RollingRedemptionScore(code, title, "", "", 0, "", 0, 0, "", false, "idle");
}
