import * as text from "../../../../kit/text.js";

/** Where a leaderboard metric is in its life cycle. */
export type LeaderboardMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One leaderboard metric, with what the planners need to act on it. */
export class LeaderboardMetric {
  code: string;
  title: string;
  version: number;
  threshold: number;
  budget: number;
  quantity: number;
  phone: string;
  category: string;
  checksum: string;
  source: string;
  currency: string;
  status: LeaderboardMetricStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    threshold: number,
    budget: number,
    quantity: number,
    phone: string,
    category: string,
    checksum: string,
    source: string,
    currency: string,
    status: LeaderboardMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.threshold = threshold;
    this.budget = budget;
    this.quantity = quantity;
    this.phone = phone;
    this.category = category;
    this.checksum = checksum;
    this.source = source;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LeaderboardMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"leaderboard metric"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.threshold * this.version * 100) / 100;
  }

  copy(): LeaderboardMetric {
    return new LeaderboardMetric(
      this.code,
      this.title,
      this.version,
      this.threshold,
      this.budget,
      this.quantity,
      this.phone,
      this.category,
      this.checksum,
      this.source,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a leaderboard metric in status planned. */
export function newLeaderboardMetric(code: string, title: string): LeaderboardMetric {
  return new LeaderboardMetric(code, title, 0, 0, 0, 0, "", "", "", "", "", "planned");
}
