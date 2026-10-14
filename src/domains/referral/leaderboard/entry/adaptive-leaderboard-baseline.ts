import * as text from "../../../../kit/text.js";

/** Where a adaptive leaderboard baseline is in its life cycle. */
export type AdaptiveLeaderboardBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive leaderboard baseline as the leaderboard team keeps it. */
export class AdaptiveLeaderboardBaseline {
  code: string;
  name: string;
  segment: string;
  revision: number;
  discount: number;
  status: AdaptiveLeaderboardBaselineStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    revision: number,
    discount: number,
    status: AdaptiveLeaderboardBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.revision = revision;
    this.discount = discount;
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

  canMoveTo(next: AdaptiveLeaderboardBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveLeaderboardBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive leaderboard baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.revision - this.discount) * 100) / 100;
  }

  copy(): AdaptiveLeaderboardBaseline {
    return new AdaptiveLeaderboardBaseline(
      this.code,
      this.name,
      this.segment,
      this.revision,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive leaderboard baseline in status planned. */
export function newAdaptiveLeaderboardBaseline(code: string, name: string): AdaptiveLeaderboardBaseline {
  return new AdaptiveLeaderboardBaseline(code, name, "", 0, 0, "planned");
}
