import * as text from "../../../../kit/text.js";

/** Where a default streak reservation is in its life cycle. */
export type DefaultStreakReservationStatus = "created" | "validated" | "published" | "retired";

/** The record of a default streak reservation and its current status. */
export class DefaultStreakReservation {
  code: string;
  name: string;
  ratio: number;
  limit: number;
  score: number;
  retries: number;
  cost: number;
  status: DefaultStreakReservationStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    limit: number,
    score: number,
    retries: number,
    cost: number,
    status: DefaultStreakReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.limit = limit;
    this.score = score;
    this.retries = retries;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultStreakReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultStreakReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default streak reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.cost + this.score) * 100) / 100;
  }

  copy(): DefaultStreakReservation {
    return new DefaultStreakReservation(
      this.code,
      this.name,
      this.ratio,
      this.limit,
      this.score,
      this.retries,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default streak reservation in status created. */
export function newDefaultStreakReservation(code: string, name: string): DefaultStreakReservation {
  return new DefaultStreakReservation(code, name, 0, 0, 0, 0, 0, "created");
}
