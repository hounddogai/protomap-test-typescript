import * as text from "../../../../kit/text.js";

/** Where a weighted pacing schedule is in its life cycle. */
export type WeightedPacingScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted pacing schedule and its current status. */
export class WeightedPacingSchedule {
  code: string;
  name: string;
  margin: number;
  score: number;
  externalRef: string;
  currency: string;
  limit: number;
  attempts: number;
  version: number;
  status: WeightedPacingScheduleStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    score: number,
    externalRef: string,
    currency: string,
    limit: number,
    attempts: number,
    version: number,
    status: WeightedPacingScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.score = score;
    this.externalRef = externalRef;
    this.currency = currency;
    this.limit = limit;
    this.attempts = attempts;
    this.version = version;
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

  canMoveTo(next: WeightedPacingScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPacingScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted pacing schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.attempts + this.score) * 100) / 100;
  }

  copy(): WeightedPacingSchedule {
    return new WeightedPacingSchedule(
      this.code,
      this.name,
      this.margin,
      this.score,
      this.externalRef,
      this.currency,
      this.limit,
      this.attempts,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted pacing schedule in status new. */
export function newWeightedPacingSchedule(code: string, name: string): WeightedPacingSchedule {
  return new WeightedPacingSchedule(code, name, 0, 0, "", "", 0, 0, 0, "new");
}
