import * as text from "../../../../kit/text.js";

/** Where a adaptive leaderboard segment is in its life cycle. */
export type AdaptiveLeaderboardSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive leaderboard segment as the leaderboard team keeps it. */
export class AdaptiveLeaderboardSegment {
  code: string;
  name: string;
  label: string;
  unit: string;
  ownerId: string;
  amount: number;
  status: AdaptiveLeaderboardSegmentStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    unit: string,
    ownerId: string,
    amount: number,
    status: AdaptiveLeaderboardSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.unit = unit;
    this.ownerId = ownerId;
    this.amount = amount;
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

  canMoveTo(next: AdaptiveLeaderboardSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: AdaptiveLeaderboardSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive leaderboard segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): AdaptiveLeaderboardSegment {
    return new AdaptiveLeaderboardSegment(
      this.code,
      this.name,
      this.label,
      this.unit,
      this.ownerId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive leaderboard segment in status proposed. */
export function newAdaptiveLeaderboardSegment(code: string, name: string): AdaptiveLeaderboardSegment {
  return new AdaptiveLeaderboardSegment(code, name, "", "", "", 0, "proposed");
}
