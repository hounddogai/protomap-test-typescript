import * as text from "../../../../kit/text.js";

/** Where a weighted leaderboard reservation is in its life cycle. */
export type WeightedLeaderboardReservationStatus =
  | "planned"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

/** One weighted leaderboard reservation, with what the planners need to act on it. */
export class WeightedLeaderboardReservation {
  code: string;
  title: string;
  score: number;
  priority: number;
  reviewer: string;
  unit: string;
  openRate: number;
  durationMinutes: number;
  windowDays: number;
  capacity: number;
  status: WeightedLeaderboardReservationStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    priority: number,
    reviewer: string,
    unit: string,
    openRate: number,
    durationMinutes: number,
    windowDays: number,
    capacity: number,
    status: WeightedLeaderboardReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.priority = priority;
    this.reviewer = reviewer;
    this.unit = unit;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.capacity = capacity;
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

  canMoveTo(next: WeightedLeaderboardReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
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

  moveTo(next: WeightedLeaderboardReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted leaderboard reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.capacity - this.windowDays) * 100) / 100;
  }

  copy(): WeightedLeaderboardReservation {
    return new WeightedLeaderboardReservation(
      this.code,
      this.title,
      this.score,
      this.priority,
      this.reviewer,
      this.unit,
      this.openRate,
      this.durationMinutes,
      this.windowDays,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted leaderboard reservation in status planned. */
export function newWeightedLeaderboardReservation(code: string, title: string): WeightedLeaderboardReservation {
  return new WeightedLeaderboardReservation(code, title, 0, 0, "", "", 0, 0, 0, 0, "planned");
}
