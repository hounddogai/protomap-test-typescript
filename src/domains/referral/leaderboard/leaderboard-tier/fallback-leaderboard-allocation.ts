import * as text from "../../../../kit/text.js";

/** Where a fallback leaderboard allocation is in its life cycle. */
export type FallbackLeaderboardAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback leaderboard allocation and its current status. */
export class FallbackLeaderboardAllocation {
  code: string;
  title: string;
  batchSize: number;
  budget: number;
  channel: string;
  description: string;
  revision: number;
  limit: number;
  unit: string;
  status: FallbackLeaderboardAllocationStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    budget: number,
    channel: string,
    description: string,
    revision: number,
    limit: number,
    unit: string,
    status: FallbackLeaderboardAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.budget = budget;
    this.channel = channel;
    this.description = description;
    this.revision = revision;
    this.limit = limit;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackLeaderboardAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackLeaderboardAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback leaderboard allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"fallback leaderboard allocation"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.limit + this.budget) * 100) / 100;
  }

  copy(): FallbackLeaderboardAllocation {
    return new FallbackLeaderboardAllocation(
      this.code,
      this.title,
      this.batchSize,
      this.budget,
      this.channel,
      this.description,
      this.revision,
      this.limit,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback leaderboard allocation in status open. */
export function newFallbackLeaderboardAllocation(code: string, title: string): FallbackLeaderboardAllocation {
  return new FallbackLeaderboardAllocation(code, title, 0, 0, "", "", 0, 0, "", "open");
}
