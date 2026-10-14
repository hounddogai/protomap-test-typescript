import * as text from "../../../../kit/text.js";

/** Where a adaptive leaderboard metric is in its life cycle. */
export type AdaptiveLeaderboardMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive leaderboard metric as the leaderboard team keeps it. */
export class AdaptiveLeaderboardMetric {
  code: string;
  name: string;
  tags: string[];
  cohort: string;
  priority: number;
  status: AdaptiveLeaderboardMetricStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    cohort: string,
    priority: number,
    status: AdaptiveLeaderboardMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.cohort = cohort;
    this.priority = priority;
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

  canMoveTo(next: AdaptiveLeaderboardMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveLeaderboardMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive leaderboard metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): AdaptiveLeaderboardMetric {
    return new AdaptiveLeaderboardMetric(this.code, this.name, this.tags, this.cohort, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive leaderboard metric in status planned. */
export function newAdaptiveLeaderboardMetric(code: string, name: string): AdaptiveLeaderboardMetric {
  return new AdaptiveLeaderboardMetric(code, name, [], "", 0, "planned");
}
