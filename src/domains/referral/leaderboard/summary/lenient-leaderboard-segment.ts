import * as text from "../../../../kit/text.js";

/** Where a lenient leaderboard segment is in its life cycle. */
export type LenientLeaderboardSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient leaderboard segment and its current status. */
export class LenientLeaderboardSegment {
  code: string;
  name: string;
  revision: number;
  minimum: number;
  updatedAt: number;
  utmSource: string;
  status: LenientLeaderboardSegmentStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    minimum: number,
    updatedAt: number,
    utmSource: string,
    status: LenientLeaderboardSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
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

  canMoveTo(next: LenientLeaderboardSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientLeaderboardSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient leaderboard segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"lenient leaderboard segment"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.updatedAt - this.revision) * 100) / 100;
  }

  copy(): LenientLeaderboardSegment {
    return new LenientLeaderboardSegment(
      this.code,
      this.name,
      this.revision,
      this.minimum,
      this.updatedAt,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient leaderboard segment in status planned. */
export function newLenientLeaderboardSegment(code: string, name: string): LenientLeaderboardSegment {
  return new LenientLeaderboardSegment(code, name, 0, 0, 0, "", "planned");
}
