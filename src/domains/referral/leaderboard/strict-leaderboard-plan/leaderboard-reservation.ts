import * as text from "../../../../kit/text.js";

/** Where a leaderboard reservation is in its life cycle. */
export type LeaderboardReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a leaderboard reservation and its current status. */
export class LeaderboardReservation {
  code: string;
  name: string;
  createdAt: number;
  revision: number;
  weight: number;
  utmSource: string;
  description: string;
  durationMinutes: number;
  status: LeaderboardReservationStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    revision: number,
    weight: number,
    utmSource: string,
    description: string,
    durationMinutes: number,
    status: LeaderboardReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.revision = revision;
    this.weight = weight;
    this.utmSource = utmSource;
    this.description = description;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.weight + this.createdAt) * 100) / 100;
  }

  copy(): LeaderboardReservation {
    return new LeaderboardReservation(
      this.code,
      this.name,
      this.createdAt,
      this.revision,
      this.weight,
      this.utmSource,
      this.description,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a leaderboard reservation in status new. */
export function newLeaderboardReservation(code: string, name: string): LeaderboardReservation {
  return new LeaderboardReservation(code, name, 0, 0, 0, "", "", 0, "new");
}
