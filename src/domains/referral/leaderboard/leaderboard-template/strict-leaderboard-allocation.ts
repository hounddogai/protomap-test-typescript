import * as text from "../../../../kit/text.js";

/** Where a strict leaderboard allocation is in its life cycle. */
export type StrictLeaderboardAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One strict leaderboard allocation, with what the planners need to act on it. */
export class StrictLeaderboardAllocation {
  code: string;
  title: string;
  segment: string;
  margin: number;
  impressions: number;
  notes: string;
  status: StrictLeaderboardAllocationStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    margin: number,
    impressions: number,
    notes: string,
    status: StrictLeaderboardAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.margin = margin;
    this.impressions = impressions;
    this.notes = notes;
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

  canMoveTo(next: StrictLeaderboardAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: StrictLeaderboardAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict leaderboard allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.margin - this.impressions) * 100) / 100;
  }

  copy(): StrictLeaderboardAllocation {
    return new StrictLeaderboardAllocation(
      this.code,
      this.title,
      this.segment,
      this.margin,
      this.impressions,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict leaderboard allocation in status proposed. */
export function newStrictLeaderboardAllocation(code: string, title: string): StrictLeaderboardAllocation {
  return new StrictLeaderboardAllocation(code, title, "", 0, 0, "", "proposed");
}
