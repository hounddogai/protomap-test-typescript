import * as text from "../../../../kit/text.js";

/** Where a batched leaderboard plan is in its life cycle. */
export type BatchedLeaderboardPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched leaderboard plan as the leaderboard team keeps it. */
export class BatchedLeaderboardPlan {
  code: string;
  name: string;
  batchSize: number;
  locale: string;
  category: string;
  country: string;
  channel: string;
  campaignRef: string;
  utmSource: string;
  maximum: number;
  status: BatchedLeaderboardPlanStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    locale: string,
    category: string,
    country: string,
    channel: string,
    campaignRef: string,
    utmSource: string,
    maximum: number,
    status: BatchedLeaderboardPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.locale = locale;
    this.category = category;
    this.country = country;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.maximum = maximum;
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

  canMoveTo(next: BatchedLeaderboardPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedLeaderboardPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched leaderboard plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round((this.maximum + this.batchSize) * 100) / 100;
  }

  copy(): BatchedLeaderboardPlan {
    return new BatchedLeaderboardPlan(
      this.code,
      this.name,
      this.batchSize,
      this.locale,
      this.category,
      this.country,
      this.channel,
      this.campaignRef,
      this.utmSource,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched leaderboard plan in status requested. */
export function newBatchedLeaderboardPlan(code: string, name: string): BatchedLeaderboardPlan {
  return new BatchedLeaderboardPlan(code, name, 0, "", "", "", "", "", "", 0, "requested");
}
