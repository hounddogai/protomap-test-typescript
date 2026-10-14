import * as text from "../../../../kit/text.js";

/** Where a level reservation is in its life cycle. */
export type LevelReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One level reservation, with what the planners need to act on it. */
export class LevelReservation {
  code: string;
  name: string;
  reviewer: string;
  revision: number;
  category: string;
  cost: number;
  notes: string;
  priority: number;
  retries: number;
  status: LevelReservationStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    revision: number,
    category: string,
    cost: number,
    notes: string,
    priority: number,
    retries: number,
    status: LevelReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.revision = revision;
    this.category = category;
    this.cost = cost;
    this.notes = notes;
    this.priority = priority;
    this.retries = retries;
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

  canMoveTo(next: LevelReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LevelReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round(this.cost * this.revision * 100) / 100;
  }

  copy(): LevelReservation {
    return new LevelReservation(
      this.code,
      this.name,
      this.reviewer,
      this.revision,
      this.category,
      this.cost,
      this.notes,
      this.priority,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a level reservation in status new. */
export function newLevelReservation(code: string, name: string): LevelReservation {
  return new LevelReservation(code, name, "", 0, "", 0, "", 0, 0, "new");
}
