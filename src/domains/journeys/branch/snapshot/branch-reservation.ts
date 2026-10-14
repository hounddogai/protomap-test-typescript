import * as text from "../../../../kit/text.js";

/** Where a branch reservation is in its life cycle. */
export type BranchReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A branch reservation. Its code is unique within a tenant. */
export class BranchReservation {
  code: string;
  title: string;
  floorValue: number;
  durationMinutes: number;
  budget: number;
  endsAt: number;
  score: number;
  utmSource: string;
  ratio: number;
  journeyId: string;
  status: BranchReservationStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    durationMinutes: number,
    budget: number,
    endsAt: number,
    score: number,
    utmSource: string,
    ratio: number,
    journeyId: string,
    status: BranchReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.endsAt = endsAt;
    this.score = score;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.journeyId = journeyId;
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

  canMoveTo(next: BranchReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
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
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"branch reservation"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.budget + this.score) * 100) / 100;
  }

  copy(): BranchReservation {
    return new BranchReservation(
      this.code,
      this.title,
      this.floorValue,
      this.durationMinutes,
      this.budget,
      this.endsAt,
      this.score,
      this.utmSource,
      this.ratio,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a branch reservation in status new. */
export function newBranchReservation(code: string, title: string): BranchReservation {
  return new BranchReservation(code, title, 0, 0, 0, 0, 0, "", 0, "", "new");
}
